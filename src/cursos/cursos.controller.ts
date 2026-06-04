import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@ApiTags('cursos')
@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un curso' })
  @ApiCreatedResponse({ description: 'Curso creado' })
  create(@Body() dto: CreateCursoDto) {
    return this.cursosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los cursos' })
  @ApiOkResponse({ description: 'Lista de cursos con módulos' })
  findAll() {
    return this.cursosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso con módulos y actividades' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Curso con estructura completa' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cursosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un curso' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Curso actualizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCursoDto,
  ) {
    return this.cursosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un curso' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Curso eliminado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cursosService.remove(id);
  }
}
