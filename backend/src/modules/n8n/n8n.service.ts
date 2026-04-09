import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { N8nEvent } from './n8n-events.enum';

/**
 * Explicit event → env var mapping. Do NOT use naive template interpolation
 * (`N8N_WEBHOOK_${event}`) because webhook vars in .env use different names.
 */
const EVENT_TO_ENV_VAR: Record<N8nEvent, string> = {
  [N8nEvent.GRIEF_FOLLOWUP_SCHEDULE]: 'N8N_WEBHOOK_GRIEF_FOLLOWUP',
  [N8nEvent.STAFF_NOTIFY]: 'N8N_WEBHOOK_STAFF_NOTIFY',
  [N8nEvent.DOC_GENERATE]: 'N8N_WEBHOOK_DOC_GENERATE',
  [N8nEvent.INTAKE_NOTIFY]: 'N8N_WEBHOOK_INTAKE_NOTIFY',
  [N8nEvent.REVIEW_REQUEST]: 'N8N_WEBHOOK_REVIEW_REQUEST',
};

@Injectable()
export class N8nService implements OnModuleInit {
  private readonly logger = new Logger(N8nService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    // Log [PLACEHOLDER] warning for any unconfigured webhook (research §7)
    for (const [event, envVar] of Object.entries(EVENT_TO_ENV_VAR)) {
      const url = this.configService.get<string>(envVar);
      if (!url || url.includes('PLACEHOLDER') || url.trim() === '') {
        this.logger.warn(
          `[PLACEHOLDER] ${event} webhook not configured (env var ${envVar}). ` +
            `n8n triggers for this event will be skipped.`,
        );
      }
    }
  }

  async trigger(event: N8nEvent, payload: Record<string, unknown>): Promise<void> {
    const envVar = EVENT_TO_ENV_VAR[event];
    const webhookUrl = this.configService.get<string>(envVar);
    if (!webhookUrl || webhookUrl.includes('PLACEHOLDER')) {
      this.logger.debug(`Skipping ${event} — webhook not configured`);
      return;
    }
    const key = this.configService.get<string>('N8N_WEBHOOK_KEY') ?? '';
    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, payload, {
          headers: { 'x-vigil-key': key },
          timeout: 5_000,
        }),
      );
      this.logger.debug(`Triggered n8n event ${event}`);
    } catch (err) {
      this.logger.error(`Failed to trigger n8n event ${event}: ${(err as Error).message}`);
    }
  }
}
