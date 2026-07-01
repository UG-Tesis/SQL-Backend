import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CursosModule } from './cursos/cursos.module';
import { ModulosModule } from './modulos/modulos.module';
import { ActividadesModule } from './actividades/actividades.module';
import { PreguntasModule } from './preguntas/preguntas.module';
import { SqlExecutorModule } from './sql-executor/sql-executor.module';
import { SqlValidationModule } from './sql-validation/sql-validation.module';
import { MisterioModule } from './misterio/misterio.module';
import { IslandModule } from './island/island.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CursosModule,
    ModulosModule,
    ActividadesModule,
    PreguntasModule,
    SqlExecutorModule,
    SqlValidationModule,
    MisterioModule,
    IslandModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
