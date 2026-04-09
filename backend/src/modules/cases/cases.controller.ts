import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CaseStatus } from '@prisma/client';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseFilterDto } from './dto/case-filter.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCaseDto) {
    return this.casesService.create(user.tenantId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() filter: CaseFilterDto) {
    return this.casesService.findAll(user.tenantId, filter);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.casesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.casesService.update(user.tenantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: CaseStatus,
  ) {
    return this.casesService.updateStatus(user.tenantId, id, status);
  }

  @Delete(':id')
  softDelete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.casesService.softDelete(user.tenantId, id);
  }
}
