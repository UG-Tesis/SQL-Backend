import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';

@Injectable()
export class PreguntasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePreguntaDto) {
    return this.prisma.preguntas.create({
      data: {
        actividad_id: dto.actividadId,
        pregunta: dto.pregunta,
        orden: dto.orden,
      },
    });
  }

  findAll(actividadId?: number) {
    return this.prisma.preguntas.findMany({
      where: actividadId ? { actividad_id: actividadId } : undefined,
      include: { actividades: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const pregunta = await this.prisma.preguntas.findUnique({
      where: { id },
      include: { actividades: true },
    });
    if (!pregunta) {
      throw new NotFoundException(`Pregunta con id ${id} no encontrada`);
    }
    return pregunta;
  }

  async update(id: number, dto: UpdatePreguntaDto) {
    await this.findOne(id);
    return this.prisma.preguntas.update({
      where: { id },
      data: {
        actividad_id: dto.actividadId,
        pregunta: dto.pregunta,
        orden: dto.orden,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.preguntas.delete({ where: { id } });
  }
}
