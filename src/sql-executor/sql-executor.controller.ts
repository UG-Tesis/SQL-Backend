import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExecuteSqlDto } from './dto/execute-sql.dto';
import { SqlExecutorService, type SqlExecutionResult } from './sql-executor.service';

@ApiTags('sql')
@Controller('sql')
export class SqlExecutorController {
  constructor(private readonly sqlExecutorService: SqlExecutorService) {}

  @Post('execute')
  @ApiOperation({
    summary: 'Ejecutar sentencia SQL en el sandbox',
    description:
      'Ejecuta la sentencia en la base de datos tesis_sandbox (entorno de práctica). ' +
      'No se permiten CREATE DATABASE, DROP DATABASE ni ALTER DATABASE.',
  })
  @ApiOkResponse({
    description: 'Resultado de la ejecución',
    schema: {
      example: {
        success: true,
        rows: [{ id: 1, nombre: 'Ana', apellido: 'Pérez' }],
        rowCount: 1,
        columns: [
          { name: 'id', type: 'int' },
          { name: 'nombre', type: 'varchar' },
          { name: 'apellido', type: 'varchar' },
        ],
        message: 'Consulta ejecutada. 1 registro(s).',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'SQL inválido o error de ejecución' })
  execute(@Body() dto: ExecuteSqlDto): Promise<SqlExecutionResult> {
    return this.sqlExecutorService.execute(dto.sql);
  }
}
