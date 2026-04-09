import { Body, Controller, Header, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IntakeService } from './intake.service';
import { IntakeFormDto } from './dto/intake-form.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Post(':slug')
  submit(@Param('slug') slug: string, @Body() dto: IntakeFormDto) {
    return this.intakeService.submit(slug, dto);
  }
}
