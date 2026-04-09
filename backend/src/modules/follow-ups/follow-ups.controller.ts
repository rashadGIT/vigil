import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('cases/:caseId/follow-ups')
export class FollowUpsController {
  constructor(private readonly service: FollowUpsService) {}

  @Post()
  schedule(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body('contactId') contactId: string,
  ) {
    return this.service.scheduleForCase(user.tenantId, caseId, contactId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.findByCase(user.tenantId, caseId);
  }
}
