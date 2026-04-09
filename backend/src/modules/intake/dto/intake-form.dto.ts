import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class IntakeContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(80)
  relationship!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class IntakeFormDto {
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

  @ValidateNested()
  @Type(() => IntakeContactDto)
  primaryContact!: IntakeContactDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
