// cron-stubs.service.ts
//
// PHASE 2 SHELL — Used ONLY when DEV_AUTH_BYPASS=true or n8n webhooks are still placeholders.
// This file exists to establish the directory structure and document the implementation pattern.
//
// ============================================================
// Phase 5 COMPLETION INSTRUCTIONS:
//
// 1. Install @nestjs/schedule:
//    npm install @nestjs/schedule --workspace=backend
//    npm install @types/cron --save-dev --workspace=backend
//
// 2. Replace this file with the full implementation:
//    import { Injectable, Logger } from '@nestjs/common';
//    import { Cron } from '@nestjs/schedule';
//    import { PrismaService } from '../../prisma/prisma.service';
//
//    @Injectable()
//    export class CronStubsService {
//      private readonly logger = new Logger(CronStubsService.name);
//
//      constructor(private readonly prisma: PrismaService) {}
//
//      @Cron('0 9 * * *')  // Daily 9am — check for pending follow-ups
//      async logPendingFollowUps(): Promise<void> {
//        if (process.env.NODE_ENV === 'production') return; // PRODUCTION GUARD: never run in production
//        // TODO Phase 5: inject PrismaService and query FollowUp.count
//        const pending = await this.prisma.followUp.count({ where: { status: 'pending' } });
//        this.logger.log(
//          `[CRON STUB] ${pending} follow-ups pending — configure n8n Wave 9 to send real emails`,
//        );
//      }
//    }
//
// 3. Register in AppModule:
//    import { ScheduleModule } from '@nestjs/schedule';
//    @Module({
//      imports: [ScheduleModule.forRoot(), ...],
//      providers: [CronStubsService],
//    })
//    export class AppModule {}
//
// 4. Disable/remove once n8n Workflow 1 (Grief Follow-Up Scheduler) is live in Phase 9.
//    The production guard ensures this never runs in production even if accidentally left in.
// ============================================================
//
// PRODUCTION GUARD PATTERN (copy into Phase 5 implementation):
//   if (process.env.NODE_ENV === 'production') return;
//
// This stub provides offline substitute for local dev (FLWP-04 requirement).
// It logs pending follow-up counts daily at 9am. It never sends real emails.
//
// n8n Workflow 1 (Phase 9) is the production replacement.

// Phase 2: Empty export to satisfy TypeScript strict mode (no real implementation yet).
// Phase 5 replaces this with the full class implementation documented above.
export {};
