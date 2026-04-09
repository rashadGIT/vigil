import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { UpsertVendorDto, AssignVendorDto } from './dto/vendor.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @Get('vendors')
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.tenantId);
  }

  @Roles('admin')
  @Post('vendors')
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertVendorDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Roles('admin')
  @Patch('vendors/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertVendorDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Roles('admin')
  @Delete('vendors/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.softDelete(user.tenantId, id);
  }

  @Post('cases/:caseId/vendors')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: AssignVendorDto,
  ) {
    return this.service.assignToCase(user.tenantId, caseId, dto);
  }

  @Get('cases/:caseId/vendors')
  findAssignments(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.service.findAssignmentsByCase(user.tenantId, caseId);
  }
}
