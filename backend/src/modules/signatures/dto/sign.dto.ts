import { IsBoolean, IsString, MinLength } from 'class-validator';

export class SignDto {
  @IsBoolean()
  intentConfirmed!: boolean;

  @IsString()
  @MinLength(10)
  signatureData!: string; // base64 PNG from canvas
}
