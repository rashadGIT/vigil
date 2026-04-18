import { IsEnum, IsOptional } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export type DashboardFilter = 'active' | 'overdue' | 'this-month' | 'pending-signatures';

export class CaseFilterDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  assignedToId?: string;

  @IsOptional()
  dashboardFilter?: DashboardFilter;
}
