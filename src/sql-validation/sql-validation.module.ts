import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SqlValidationController } from './sql-validation.controller';
import { SqlValidationService } from './sql-validation.service';

@Module({
  imports: [PrismaModule],
  controllers: [SqlValidationController],
  providers: [SqlValidationService],
  exports: [SqlValidationService],
})
export class SqlValidationModule {}
