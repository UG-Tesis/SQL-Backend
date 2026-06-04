import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProgresoService } from './progreso.service';
import {
  CreateAvanceActividadDto,
  CreateModuloEstadoDto,
  CreateProgresoModuloDto,
  UpdateAvanceActividadDto,
  UpdateModuloEstadoDto,
  UpdateProgresoModuloDto,
} from './dto/progreso.dto';

@ApiTags('progreso')
@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Post('modulos-estado')
  @ApiOperation({ summary: 'Registrar estado de un módulo' })
  @ApiCreatedResponse({ description: 'Estado de módulo creado' })
  createModuloEstado(@Body() dto: CreateModuloEstadoDto) {
    return this.progresoService.createModuloEstado(dto);
  }

  @Get('modulos-estado')
  @ApiOperation({ summary: 'Listar estados de módulos' })
  @ApiQuery({ name: 'inscripcionId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de estados de módulos' })
  findModulosEstado(@Query('inscripcionId') inscripcionId?: string) {
    return this.progresoService.findModulosEstado(
      inscripcionId ? Number(inscripcionId) : undefined,
    );
  }

  @Patch('modulos-estado/:id')
  @ApiOperation({ summary: 'Actualizar estado de un módulo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Estado de módulo actualizado' })
  updateModuloEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuloEstadoDto,
  ) {
    return this.progresoService.updateModuloEstado(id, dto);
  }

  @Post('modulos')
  @ApiOperation({ summary: 'Registrar progreso de un módulo' })
  @ApiCreatedResponse({ description: 'Progreso de módulo creado' })
  createProgresoModulo(@Body() dto: CreateProgresoModuloDto) {
    return this.progresoService.createProgresoModulo(dto);
  }

  @Get('modulos')
  @ApiOperation({ summary: 'Listar progreso de módulos' })
  @ApiQuery({ name: 'inscripcionId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de progreso de módulos' })
  findProgresosModulos(@Query('inscripcionId') inscripcionId?: string) {
    return this.progresoService.findProgresosModulos(
      inscripcionId ? Number(inscripcionId) : undefined,
    );
  }

  @Patch('modulos/:id')
  @ApiOperation({ summary: 'Actualizar progreso de un módulo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Progreso de módulo actualizado' })
  updateProgresoModulo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgresoModuloDto,
  ) {
    return this.progresoService.updateProgresoModulo(id, dto);
  }

  @Post('actividades')
  @ApiOperation({ summary: 'Registrar avance de una actividad' })
  @ApiCreatedResponse({ description: 'Avance de actividad creado' })
  createAvanceActividad(@Body() dto: CreateAvanceActividadDto) {
    return this.progresoService.createAvanceActividad(dto);
  }

  @Get('actividades')
  @ApiOperation({ summary: 'Listar avances de actividades' })
  @ApiQuery({ name: 'inscripcionId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de avances de actividades' })
  findAvancesActividad(@Query('inscripcionId') inscripcionId?: string) {
    return this.progresoService.findAvancesActividad(
      inscripcionId ? Number(inscripcionId) : undefined,
    );
  }

  @Patch('actividades/:id')
  @ApiOperation({ summary: 'Actualizar avance de una actividad' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Avance de actividad actualizado' })
  updateAvanceActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAvanceActividadDto,
  ) {
    return this.progresoService.updateAvanceActividad(id, dto);
  }
}
