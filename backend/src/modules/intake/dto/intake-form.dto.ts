import { Type } from 'class-transformer';
import {
  IsDefined,
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
import { ApiProperty } from '@nestjs/swagger';

export class IntakeContactDto {
  @ApiProperty({ description: 'Full name of the primary contact (next of kin)', example: 'James Williams' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ description: 'Relationship to the deceased', example: 'Son' })
  @IsString()
  @MaxLength(80)
  relationship!: string;

  @ApiProperty({ description: 'Contact email address', example: 'james.williams@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Contact phone number', example: '+15135551234', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class IntakeFormDto {
  @ApiProperty({ description: 'Full legal name of the deceased', example: 'Margaret Anne Williams' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  deceasedName!: string;

  @ApiProperty({ description: 'Date of birth of the deceased (ISO 8601)', example: '1942-03-15', required: false })
  @IsOptional()
  @IsDateString()
  deceasedDob?: string;

  @ApiProperty({ description: 'Date of death (ISO 8601)', example: '2024-11-20', required: false })
  @IsOptional()
  @IsDateString()
  deceasedDod?: string;

  @ApiProperty({ description: 'Type of funeral service requested', enum: ServiceType, example: ServiceType.BURIAL })
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({ description: 'Primary next-of-kin contact information', type: IntakeContactDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => IntakeContactDto)
  primaryContact!: IntakeContactDto;

  @ApiProperty({ description: 'Any additional notes or requests from the family', example: 'Please contact after 5pm', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
