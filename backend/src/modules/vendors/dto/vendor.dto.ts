import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorType } from '@prisma/client';

export class UpsertVendorDto {
  @IsString()
  name!: string;

  @IsEnum(VendorType)
  type!: VendorType;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class AssignVendorDto {
  @IsString()
  vendorId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}
