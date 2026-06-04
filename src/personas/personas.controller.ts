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
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@ApiTags('personas')
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una persona' })
  @ApiCreatedResponse({ description: 'Persona creada' })
  create(@Body() dto: CreatePersonaDto) {
    return this.personasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las personas' })
  @ApiOkResponse({ description: 'Lista de personas' })
  findAll() {
    return this.personasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una persona por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Persona con sus inscripciones' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una persona' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Persona actualizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonaDto,
  ) {
    return this.personasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una persona' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Persona eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.remove(id);
  }
}
