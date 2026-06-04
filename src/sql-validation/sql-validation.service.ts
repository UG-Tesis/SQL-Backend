import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateSqlByType } from './sql-validation.rules';
import {
  MODULE_TASK_EXPECTATIONS,
  MODULE_VALIDATION_BY_ORDEN,
  type SqlValidationResult,
  type SqlValidationType,
  type TaskExpectation,
} from './sql-validation.types';

@Injectable()
export class SqlValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(input: {
    sql: string;
    actividadId?: number;
    validationType?: SqlValidationType;
  }): Promise<SqlValidationResult> {
    let type = input.validationType;
    let expectation: TaskExpectation | undefined;

    if (input.actividadId) {
      const actividadContext = await this.resolveActividadContext(input.actividadId);
      type = type ?? actividadContext.validationType;
      expectation = actividadContext.expectation;
    }

    if (!type) {
      throw new BadRequestException(
        'Debes enviar actividadId o validationType para validar la consulta.',
      );
    }

    return validateSqlByType(input.sql, type, expectation);
  }

  private async resolveActividadContext(actividadId: number): Promise<{
    validationType: SqlValidationType;
    expectation?: TaskExpectation;
  }> {
    const actividad = await this.prisma.actividades.findUnique({
      where: { id: actividadId },
      include: { modulos: true },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con id ${actividadId} no encontrada`);
    }

    const moduloOrden = actividad.modulos.orden;
    const validationByOrden = MODULE_VALIDATION_BY_ORDEN[moduloOrden];
    if (!validationByOrden) {
      throw new BadRequestException(
        `No hay reglas de validación configuradas para el módulo ${moduloOrden}.`,
      );
    }

    const validationType = validationByOrden[actividad.orden];
    if (!validationType) {
      throw new BadRequestException(
        `No hay reglas de validación para la actividad en orden ${actividad.orden}.`,
      );
    }

    return {
      validationType,
      expectation: MODULE_TASK_EXPECTATIONS[moduloOrden]?.[actividad.orden],
    };
  }
}
