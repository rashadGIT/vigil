import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsUrl()
  googleReviewUrl?: string;
}
