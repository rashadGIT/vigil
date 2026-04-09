import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpsertPaymentDto } from './dto/upsert-payment.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('cases/:caseId/payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Put()
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: UpsertPaymentDto,
  ) {
    return this.paymentsService.upsert(user.tenantId, caseId, dto);
  }

  @Get()
  get(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.paymentsService.findByCase(user.tenantId, caseId);
  }
}
