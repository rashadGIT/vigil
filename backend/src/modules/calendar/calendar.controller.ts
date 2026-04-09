import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { UpsertEventDto } from './dto/calendar-event.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertEventDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    return this.service.findInRange(user.tenantId, fromDate, toDate);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertEventDto,
  ) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}
