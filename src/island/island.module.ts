import { Module } from '@nestjs/common';
import { IslandController } from './island.controller';
import { IslandDatabaseProvisionerService } from './island-database-provisioner.service';
import { IslandExecutorService } from './island-executor.service';
import { IslandMissionValidatorService } from './island-mission-validator.service';
import { IslandSessionService } from './island-session.service';

@Module({
  controllers: [IslandController],
  providers: [
    IslandDatabaseProvisionerService,
    IslandSessionService,
    IslandExecutorService,
    IslandMissionValidatorService,
  ],
  exports: [IslandExecutorService, IslandSessionService],
})
export class IslandModule {}
