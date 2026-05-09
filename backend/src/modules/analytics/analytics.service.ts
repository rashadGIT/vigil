import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(tenantId: string, period?: string, from?: string, to?: string) {
    const scoped = this.prisma.forTenant(tenantId);
    const where: Record<string, unknown> = {};
    if (period) where['period'] = period;
    if (from || to) {
      where['periodStart'] = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    return scoped.analyticsSnapshot.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });
  }

  async computeAndSave(tenantId: string, period: string, periodStart: string) {
    const scoped = this.prisma.forTenant(tenantId);

    const [casesByStatus, totalRevenue] = await Promise.all([
      scoped.case.groupBy({ by: ['status'], _count: true }),
      scoped.payment.aggregate({ _sum: { amountPaid: true } }),
    ]);

    const metrics = {
      casesByStatus,
      totalRevenue: totalRevenue._sum.amountPaid ?? 0,
    };

    return scoped.analyticsSnapshot.create({
      data: {
        tenantId,
        period,
        periodStart: new Date(periodStart),
        metrics,
      },
    });
  }
}
