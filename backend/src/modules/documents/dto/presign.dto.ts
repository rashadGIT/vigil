import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class PresignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsEnum(DocumentType)
  documentType!: DocumentType;
}
