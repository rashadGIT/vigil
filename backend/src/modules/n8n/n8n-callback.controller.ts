import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { N8nService } from './n8n.service';
import { InternalOnly } from '../../common/decorators/internal-only.decorator';

@Controller('internal/n8n')
export class N8nCallbackController {
  constructor(private readonly n8nService: N8nService) {}

  @Post('callback')
  @HttpCode(200)
  @InternalOnly()
  handleCallback(
    @Body() body: { event: string; payload: unknown },
    @Headers('x-vigil-internal-key') _internalKey: string,
  ): { received: true } {
    this.n8nService.handleCallback(body.event, body.payload);
    return { received: true };
  }
}
