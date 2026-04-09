import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('cases/:caseId/tasks')
  create(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.tenantId, caseId, dto);
  }

  @Get('cases/:caseId/tasks')
  findByCase(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.tasksService.findByCase(user.tenantId, caseId);
  }

  @Get('tasks/overdue')
  findOverdue(@CurrentUser() user: AuthUser) {
    return this.tasksService.findOverdue(user.tenantId);
  }

  @Patch('tasks/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.tenantId, id, dto, user.sub);
  }

  @Delete('tasks/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.remove(user.tenantId, id);
  }
}
