import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ValidateSqlDto } from './dto/validate-sql.dto';
import { SqlValidationService } from './sql-validation.service';
import type { SqlValidationResult } from './sql-validation.types';

@ApiTags('sql')
@Controller('sql')
export class SqlValidationController {
  constructor(private readonly sqlValidationService: SqlValidationService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Validar sentencia SQL sin ejecutarla',
    description:
      'Analiza CREATE/DROP/USE DATABASE, ALTER TABLE e INSERT/UPDATE/DELETE sin modificar la base de datos cuando corresponda. ' +
      'Devuelve correcto o incorrecto según la escritura.',
  })
  @ApiOkResponse({
    description: 'Resultado de la validación',
    schema: {
      example: {
        correct: true,
        message: 'Correcto: sentencia CREATE DATABASE válida.',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos' })
  validate(@Body() dto: ValidateSqlDto): Promise<SqlValidationResult> {
    return this.sqlValidationService.validate({
      sql: dto.sql,
      actividadId: dto.actividadId,
      validationType: dto.validationType,
    });
  }
}
