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
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@ApiTags('inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  @ApiOperation({ summary: 'Inscribir una persona en un curso' })
  @ApiCreatedResponse({ description: 'Inscripción creada' })
  create(@Body() dto: CreateInscripcionDto) {
    return this.inscripcionesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inscripciones' })
  @ApiQuery({ name: 'personaId', required: false, type: Number })
  @ApiQuery({ name: 'cursoId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de inscripciones' })
  findAll(
    @Query('personaId') personaId?: string,
    @Query('cursoId') cursoId?: string,
  ) {
    return this.inscripcionesService.findAll({
      personaId: personaId ? Number(personaId) : undefined,
      cursoId: cursoId ? Number(cursoId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener inscripción con progreso completo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Inscripción con progreso completo' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una inscripción' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Inscripción actualizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInscripcionDto,
  ) {
    return this.inscripcionesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una inscripción' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Inscripción eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.remove(id);
  }
}
