import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TaskTemplatesService } from '../tasks/task-templates.service';
import { IntakeFormDto } from './dto/intake-form.dto';

@Injectable()
export class IntakeService {
  private readonly logger = new Logger(IntakeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskTemplates: TaskTemplatesService,
  ) {}

  async submit(tenantSlug: string, dto: IntakeFormDto): Promise<{ caseId: string }> {
    // Resolve tenant via slug. MUST use bare this.prisma.tenant (Tenant has no tenantId column).
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, active: true },
    });
    if (!tenant || !tenant.active) {
      throw new NotFoundException(`No active tenant for slug "${tenantSlug}"`);
    }
    const tenantId = tenant.id;

    // Atomic transaction (D-18, INTK-02). All-or-nothing.
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Case
      const createdCase = await tx.case.create({
        data: {
          tenantId,
          deceasedName: dto.deceasedName,
          deceasedDob: dto.deceasedDob ? new Date(dto.deceasedDob) : null,
          deceasedDod: dto.deceasedDod ? new Date(dto.deceasedDod) : null,
          serviceType: dto.serviceType,
        },
      });

      // 2. Create primary FamilyContact
      await tx.familyContact.create({
        data: {
          tenantId,
          caseId: createdCase.id,
          name: dto.primaryContact.name,
          relationship: dto.primaryContact.relationship,
          email: dto.primaryContact.email ?? null,
          phone: dto.primaryContact.phone ?? null,
          isPrimaryContact: true,
        },
      });

      // 3. Bulk-create Tasks from service-type template
      const templateTasks = this.taskTemplates.buildTasksForCase(
        tenantId,
        createdCase.id,
        dto.serviceType,
      );
      await tx.task.createMany({ data: templateTasks });

      // 4. CalendarEvent placeholder (TBD time — start=now, end=now+1h, type=service)
      const now = new Date();
      await tx.calendarEvent.create({
        data: {
          tenantId,
          caseId: createdCase.id,
          title: `${dto.serviceType.toUpperCase()} — ${dto.deceasedName}`,
          eventType: EventType.service,
          startTime: now,
          endTime: new Date(now.getTime() + 60 * 60 * 1000),
          notes: 'Placeholder — confirm date/time with family',
        },
      });

      return { caseId: createdCase.id };
    });

    // 5. Trigger n8n INTAKE_NOTIFY webhook (fire-and-forget — N8nService wired in Plan 05-05)
    // For now, log; Plan 05-05 adds the real N8nService call via an injected dependency.
    this.logger.log(`[INTAKE] Submitted for tenant=${tenantId} case=${result.caseId}`);

    return result;
  }
}
