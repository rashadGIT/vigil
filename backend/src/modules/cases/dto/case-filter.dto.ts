import { IsEnum, IsOptional } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class CaseFilterDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  assignedToId?: string;
}
