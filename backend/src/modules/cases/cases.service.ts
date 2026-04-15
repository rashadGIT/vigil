import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CaseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { N8nService } from '../n8n/n8n.service';
import { N8nEvent } from '../n8n/n8n-events.enum';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseFilterDto } from './dto/case-filter.dto';

// Allowed status transitions (CASE-03)
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  new: [CaseStatus.in_progress, CaseStatus.archived],
  in_progress: [CaseStatus.completed, CaseStatus.archived],
  completed: [CaseStatus.archived],
  archived: [],
};

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly n8n: N8nService,
  ) {}

  create(tenantId: string, dto: CreateCaseDto) {
    const data: Prisma.CaseUncheckedCreateInput = {
      tenantId, // forTenant() also injects; explicit here for type clarity
      deceasedName: dto.deceasedName,
      deceasedDob: dto.deceasedDob ? new Date(dto.deceasedDob) : null,
      deceasedDod: dto.deceasedDod ? new Date(dto.deceasedDod) : null,
      serviceType: dto.serviceType,
      assignedToId: dto.assignedToId ?? null,
      faithTradition: dto.faithTradition ?? null,
    };
    return this.prisma.forTenant(tenantId).case.create({ data });
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const db = this.prisma.forTenant(tenantId);

    const [activeCases, casesThisMonth, overdueTasks, pendingSignatures] = await Promise.all([
      db.case.count({ where: { deletedAt: null, status: { in: ['new', 'in_progress'] } } }),
      db.case.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      db.task.count({ where: { completed: false, dueDate: { lt: now } } }),
      db.signature.count({ where: { signedAt: null } }),
    ]);

    return { activeCases, casesThisMonth, overdueTasks, pendingSignatures };
  }

  async findAll(tenantId: string, filter: CaseFilterDto) {
    const now = new Date();
    const cases = await this.prisma.forTenant(tenantId).case.findMany({
      where: {
        deletedAt: null,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
      },
      include: {
        tasks: {
          where: { completed: false, dueDate: { lt: now } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return cases.map((c) => ({
      ...c,
      overdueTaskCount: c.tasks.length,
      tasks: undefined,
    }));
  }

  async findOne(tenantId: string, id: string) {
    const found = await this.prisma.forTenant(tenantId).case.findFirst({
      where: { id, deletedAt: null },
      include: {
        familyContacts: true,
        tasks: { orderBy: { createdAt: 'asc' } },
        obituary: true,
        documents: true,
        payment: true,
        signatures: true,
        caseLineItems: { include: { priceListItem: true } },
      },
    });
    if (!found) throw new NotFoundException(`Case ${id} not found`);
    return found;
  }

  async update(tenantId: string, id: string, dto: UpdateCaseDto) {
    await this.findOne(tenantId, id);
    const { status, ...rest } = dto;
    if (status) {
      await this.assertValidTransition(tenantId, id, status);
    }
    return this.prisma.forTenant(tenantId).case.update({
      where: { id },
      data: {
        ...rest,
        ...(status ? { status } : {}),
        deceasedDob: dto.deceasedDob ? new Date(dto.deceasedDob) : undefined,
        deceasedDod: dto.deceasedDod ? new Date(dto.deceasedDod) : undefined,
      },
    });
  }

  async updateStatus(tenantId: string, id: string, status: CaseStatus) {
    await this.assertValidTransition(tenantId, id, status);
    const updated = await this.prisma.forTenant(tenantId).case.update({
      where: { id },
      data: { status },
    });

    if (status === CaseStatus.completed) {
      const kase = await this.prisma.forTenant(tenantId).case.findFirst({
        where: { id },
        include: {
          familyContacts: { where: { isPrimaryContact: true }, take: 1 },
          tenant: true,
        },
      });
      if (kase) {
        const primary = kase.familyContacts[0];
        await Promise.all([
          this.n8n.trigger(N8nEvent.REVIEW_REQUEST, {
            tenantId,
            caseId: id,
            familyEmail: primary?.email ?? '',
            familyPhone: primary?.phone ?? '',
            funeralHomeName: kase.tenant.name,
            googleReviewUrl: kase.tenant.googleReviewUrl ?? '',
          }),
          this.n8n.trigger(N8nEvent.DOC_GENERATE, { caseId: id, tenantId }),
        ]);
      }
    }

    return updated;
  }

  /**
   * Two-stage soft delete (CASE-06):
   *  - Stage 1: set deletedAt (90-day recoverable window)
   *  - Stage 2: n8n retention workflow (Phase 9) sets archivedAt at +90d
   *  - Hard delete after 7 years (Phase 9 workflow 5)
   */
  async softDelete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.forTenant(tenantId).case.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Cross-tenant hard delete of cases archived over 7 years ago.
   * This is the ONLY legitimate cross-tenant query in the codebase.
   * Called by n8n Workflow 5 (Data Retention Cleanup) via @InternalOnly() guard.
   * Bypasses forTenant() intentionally — retention is a global operation.
   */
  async hardDeleteExpiredCases(): Promise<{ deletedCount: number }> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 7);
    const result = await this.prisma.case.deleteMany({
      where: {
        archivedAt: { not: null, lt: cutoff },
      },
    });
    return { deletedCount: result.count };
  }

  /**
   * Cross-tenant overdue task summary for daily digest email.
   * Called by n8n Workflow 2 CRON path via @InternalOnly() guard.
   */
  async getOverdueTaskSummary(): Promise<Array<{ tenantId: string; overdueCount: number; caseIds: string[] }>> {
    const now = new Date();
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
      },
      select: {
        case: { select: { id: true, tenantId: true } },
      },
    });

    // Group by tenantId
    const byTenant = new Map<string, Set<string>>();
    for (const t of overdueTasks) {
      const tid = t.case.tenantId;
      if (!byTenant.has(tid)) byTenant.set(tid, new Set());
      byTenant.get(tid)!.add(t.case.id);
    }

    return Array.from(byTenant.entries()).map(([tenantId, caseIdSet]) => ({
      tenantId,
      overdueCount: caseIdSet.size,
      caseIds: Array.from(caseIdSet),
    }));
  }

  private async assertValidTransition(
    tenantId: string,
    id: string,
    target: CaseStatus,
  ): Promise<void> {
    const current = await this.prisma.forTenant(tenantId).case.findFirst({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new NotFoundException(`Case ${id} not found`);
    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Invalid status transition: ${current.status} → ${target}`,
      );
    }
  }
}
