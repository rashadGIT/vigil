import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PresignDto } from './dto/presign.dto';
import { ConfirmDto } from './dto/confirm.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('cases/:caseId/documents/presign')
  presign(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: PresignDto,
  ) {
    return this.documentsService.createPresign(user.tenantId, caseId, user.sub, dto);
  }

  @Post('cases/:caseId/documents/confirm')
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmDto) {
    return this.documentsService.confirmUpload(user.tenantId, dto.documentId);
  }

  @Get('cases/:caseId/documents')
  findByCase(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.documentsService.findByCase(user.tenantId, caseId);
  }

  @Get('documents/:id/url')
  getUrl(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documentsService.getSignedUrl(user.tenantId, id);
  }

  @Delete('documents/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documentsService.softDelete(user.tenantId, id);
  }
}
