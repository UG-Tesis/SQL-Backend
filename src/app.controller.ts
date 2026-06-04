import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio' })
  @ApiOkResponse({
    description: 'Servicio activo y conectado a la base de datos',
    schema: {
      example: {
        status: 'ok',
        service: 'tesis-sql-backend',
        orm: 'prisma',
        database: 'tesis_sql',
      },
    },
  })
  health() {
    return {
      status: 'ok',
      service: 'tesis-sql-backend',
      orm: 'prisma',
      database: 'tesis_sql',
    };
  }
}
