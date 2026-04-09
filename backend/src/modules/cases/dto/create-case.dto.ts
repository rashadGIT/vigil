import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateCaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  deceasedName!: string;

  @IsOptional()
  @IsDateString()
  deceasedDob?: string;

  @IsOptional()
  @IsDateString()
  deceasedDod?: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  faithTradition?: string;
}
