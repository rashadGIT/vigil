import { IsArray, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { EventType } from '@prisma/client';

export class UpsertEventDto {
  @IsString()
  title!: string;

  @IsEnum(EventType)
  eventType!: EventType;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  staffIds?: string[];
}
