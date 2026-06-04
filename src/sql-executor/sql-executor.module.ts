import { Module } from '@nestjs/common';
import { SqlExecutorController } from './sql-executor.controller';
import { SqlExecutorService } from './sql-executor.service';

@Module({
  controllers: [SqlExecutorController],
  providers: [SqlExecutorService],
  exports: [SqlExecutorService],
})
export class SqlExecutorModule {}
