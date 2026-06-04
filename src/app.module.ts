import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PersonasModule } from './personas/personas.module';
import { CursosModule } from './cursos/cursos.module';
import { ModulosModule } from './modulos/modulos.module';
import { ActividadesModule } from './actividades/actividades.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { PreguntasModule } from './preguntas/preguntas.module';
import { ProgresoModule } from './progreso/progreso.module';
import { SqlExecutorModule } from './sql-executor/sql-executor.module';
import { SqlValidationModule } from './sql-validation/sql-validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PersonasModule,
    CursosModule,
    ModulosModule,
    ActividadesModule,
    InscripcionesModule,
    PreguntasModule,
    ProgresoModule,
    SqlExecutorModule,
    SqlValidationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
