import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExecuteMisterioSqlDto } from './dto/execute-misterio-sql.dto';
import { VerificarSolucionDto } from './dto/verificar-solucion.dto';
import {
  MisterioExecutorService,
  type MisterioSqlExecutionResult,
} from './misterio-executor.service';
import {
  MisterioSolutionService,
  type MisterioSolutionCheck,
} from './misterio-solution.service';

@ApiTags('misterio')
@Controller('misterio')
export class MisterioController {
  constructor(
    private readonly misterioExecutorService: MisterioExecutorService,
    private readonly solutionService: MisterioSolutionService,
  ) {}

  @Post('sql/execute')
  @ApiOperation({
    summary: 'Ejecutar SQL en el juego del misterio',
    description:
      'Ejecuta SELECT sobre tesis_misterio o INSERT en la tabla solucion para verificar la respuesta del jugador.',
  })
  @ApiOkResponse({
    description: 'Resultado de la ejecución',
    schema: {
      example: {
        success: true,
        rows: [
          {
            fecha: 20180115,
            tipo: 'asesinato',
            ciudad: 'Ciudad SQL',
            descripcion:
              'Las cámaras de seguridad muestran que hubo 2 testigos...',
          },
        ],
        rowCount: 1,
        columns: [
          { name: 'fecha', type: 'int' },
          { name: 'tipo', type: 'varchar' },
          { name: 'ciudad', type: 'varchar' },
          { name: 'descripcion', type: 'varchar' },
        ],
        message: 'Consulta ejecutada. 1 registro(s).',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'SQL inválido o error de ejecución' })
  executeSql(
    @Body() dto: ExecuteMisterioSqlDto,
  ): Promise<MisterioSqlExecutionResult> {
    return this.misterioExecutorService.execute(dto.sql);
  }

  @Post('solucion/verificar')
  @ApiOperation({
    summary: 'Verificar nombre del sospechoso',
    description:
      'Alternativa al INSERT en solucion. Evalúa si el nombre corresponde al asesino o a la mente criminal.',
  })
  @ApiOkResponse({
    description: 'Resultado de la verificación',
    schema: {
      example: {
        correct: true,
        etapa: 1,
        mensaje:
          '¡Felicidades, encontraste al asesino! Pero espera, hay más…',
      },
    },
  })
  verificarSolucion(
    @Body() dto: VerificarSolucionDto,
  ): MisterioSolutionCheck {
    return this.solutionService.evaluate(dto.nombre);
  }
}
