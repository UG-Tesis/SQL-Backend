import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@Injectable()
export class InscripcionesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInscripcionDto) {
    return this.prisma.inscripciones.create({
      data: {
        persona_id: dto.personaId,
        curso_id: dto.cursoId,
        estado: dto.estado,
        porcentaje_avance: dto.porcentajeAvance,
      },
    });
  }

  findAll(filters?: { personaId?: number; cursoId?: number }) {
    return this.prisma.inscripciones.findMany({
      where: {
        ...(filters?.personaId && { persona_id: filters.personaId }),
        ...(filters?.cursoId && { curso_id: filters.cursoId }),
      },
      include: { personas: true, cursos: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const inscripcion = await this.prisma.inscripciones.findUnique({
      where: { id },
      include: {
        personas: true,
        cursos: true,
        modulo_estado: { include: { modulos: true } },
        progreso_modulos: { include: { modulos: true } },
        avance_actividad: { include: { actividades: true } },
      },
    });
    if (!inscripcion) {
      throw new NotFoundException(`Inscripcion con id ${id} no encontrada`);
    }
    return inscripcion;
  }

  async update(id: number, dto: UpdateInscripcionDto) {
    await this.findOne(id);
    return this.prisma.inscripciones.update({
      where: { id },
      data: {
        persona_id: dto.personaId,
        curso_id: dto.cursoId,
        estado: dto.estado,
        porcentaje_avance: dto.porcentajeAvance,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.inscripciones.delete({ where: { id } });
  }
}
