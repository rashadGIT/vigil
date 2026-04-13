import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { InternalCasesController } from './internal-cases.controller';
import { CasesService } from './cases.service';

@Module({
  controllers: [CasesController, InternalCasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
