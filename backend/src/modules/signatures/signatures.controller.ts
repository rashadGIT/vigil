import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { SignaturesService } from './signatures.service';
import { RequestSignatureDto } from './dto/request-signature.dto';
import { SignDto } from './dto/sign.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class SignaturesController {
  constructor(private readonly service: SignaturesService) {}

  // Authenticated — staff requests a signature
  @Post('cases/:caseId/signatures/request')
  request(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: RequestSignatureDto,
  ) {
    return this.service.request(user.tenantId, caseId, dto);
  }

  @Get('cases/:caseId/signatures')
  findByCase(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.findByCase(user.tenantId, caseId);
  }

  // Public signing endpoints — no auth, tokens are the authorization
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('sign/:token')
  getByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('sign/:token/intent')
  confirmIntent(@Param('token') token: string) {
    return this.service.confirmIntent(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('sign/:token')
  sign(@Param('token') token: string, @Body() dto: SignDto, @Req() req: Request) {
    const ip = (req.ip as string | undefined) ?? '';
    return this.service.sign(token, dto, ip);
  }
}
