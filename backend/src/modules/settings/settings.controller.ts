import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get tenant settings' })
  @ApiResponse({ status: 200, description: 'Returns tenant settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  get(@CurrentUser() user: AuthUser) {
    return this.settingsService.get(user.tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.tenantId, dto);
  }
}
