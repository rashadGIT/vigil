import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertPaymentDto {
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
