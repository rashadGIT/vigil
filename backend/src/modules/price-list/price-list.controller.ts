import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { UpsertPriceListItemDto } from './dto/price-list-item.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class PriceListController {
  constructor(private readonly service: PriceListService) {}

  @Get('price-list')
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.tenantId);
  }

  @Roles('admin')
  @Post('price-list')
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertPriceListItemDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Roles('admin')
  @Patch('price-list/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertPriceListItemDto,
  ) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Post('cases/:caseId/gpl/generate')
  generate(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.generateGplPdf(user.tenantId, caseId);
  }
}
