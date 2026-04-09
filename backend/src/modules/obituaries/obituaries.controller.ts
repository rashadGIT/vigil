import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ObituariesService } from './obituaries.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('cases/:caseId/obituary')
export class ObituariesController {
  constructor(private readonly service: ObituariesService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.generate(user.tenantId, caseId);
  }

  @Get()
  get(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.findByCase(user.tenantId, caseId);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() body: { draftText: string; status?: string },
  ) {
    return this.service.update(user.tenantId, caseId, body.draftText, body.status);
  }
}
