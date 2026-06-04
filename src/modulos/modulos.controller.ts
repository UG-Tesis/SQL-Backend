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
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@ApiTags('modulos')
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un módulo' })
  @ApiCreatedResponse({ description: 'Módulo creado' })
  create(@Body() dto: CreateModuloDto) {
    return this.modulosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar módulos' })
  @ApiQuery({ name: 'cursoId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de módulos' })
  findAll(@Query('cursoId') cursoId?: string) {
    const parsedCursoId = cursoId ? Number(cursoId) : undefined;
    return this.modulosService.findAll(parsedCursoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un módulo con actividades' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Módulo con actividades y preguntas' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modulosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un módulo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Módulo actualizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuloDto,
  ) {
    return this.modulosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un módulo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Módulo eliminado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modulosService.remove(id);
  }
}
