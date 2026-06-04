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
import { PreguntasService } from './preguntas.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';

@ApiTags('preguntas')
@Controller('preguntas')
export class PreguntasController {
  constructor(private readonly preguntasService: PreguntasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una pregunta' })
  @ApiCreatedResponse({ description: 'Pregunta creada' })
  create(@Body() dto: CreatePreguntaDto) {
    return this.preguntasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar preguntas' })
  @ApiQuery({ name: 'actividadId', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de preguntas' })
  findAll(@Query('actividadId') actividadId?: string) {
    return this.preguntasService.findAll(
      actividadId ? Number(actividadId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una pregunta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Pregunta de actividad' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.preguntasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una pregunta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Pregunta actualizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePreguntaDto,
  ) {
    return this.preguntasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una pregunta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Pregunta eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.preguntasService.remove(id);
  }
}
