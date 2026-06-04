import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';

@ApiTags('actividades')
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una actividad' })
  @ApiCreatedResponse({ description: 'Actividad creada' })
  create(@Body() dto: CreateActividadDto) {
    return this.actividadesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar actividades' })
  @ApiQuery({ name: 'moduloId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de actividades' })
  findAll(@Query('moduloId') moduloId?: string) {
    const parsedModuloId = moduloId ? Number(moduloId) : undefined;
    return this.actividadesService.findAll(parsedModuloId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una actividad con preguntas' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Actividad con preguntas' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una actividad' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Actividad actualizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
  ) {
    return this.actividadesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una actividad' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Actividad eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.remove(id);
  }
}
