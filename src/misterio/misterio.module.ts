import { Module } from '@nestjs/common';
import { MisterioController } from './misterio.controller';
import { MisterioExecutorService } from './misterio-executor.service';
import { MisterioSolutionService } from './misterio-solution.service';

@Module({
  controllers: [MisterioController],
  providers: [MisterioExecutorService, MisterioSolutionService],
  exports: [MisterioExecutorService, MisterioSolutionService],
})
export class MisterioModule {}
