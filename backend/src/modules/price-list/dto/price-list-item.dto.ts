import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PriceCategory } from '@prisma/client';

export class UpsertPriceListItemDto {
  @IsEnum(PriceCategory)
  category!: PriceCategory;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
