import { Module } from '@nestjs/common';
import { FamilyPortalController } from './family-portal.controller';
import { FamilyPortalService } from './family-portal.service';

@Module({
  controllers: [FamilyPortalController],
  providers: [FamilyPortalService],
  exports: [FamilyPortalService],
})
export class FamilyPortalModule {}
