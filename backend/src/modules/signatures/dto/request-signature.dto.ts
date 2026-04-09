import { IsEnum, IsString } from 'class-validator';
import { SignatureDocument } from '@prisma/client';

export class RequestSignatureDto {
  @IsString()
  contactId!: string;

  @IsEnum(SignatureDocument)
  documentType!: SignatureDocument;

  @IsString()
  signerName!: string;
}
