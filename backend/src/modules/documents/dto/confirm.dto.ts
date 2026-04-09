import { IsString } from 'class-validator';

export class ConfirmDto {
  @IsString()
  documentId!: string;
}
