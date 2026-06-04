import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateActividadDto) {
    return this.prisma.actividades.create({
      data: {
        modulo_id: dto.moduloId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        orden: dto.orden,
        activo: dto.activo,
      },
    });
  }

  findAll(moduloId?: number) {
    return this.prisma.actividades.findMany({
      where: moduloId ? { modulo_id: moduloId } : undefined,
      include: { modulos: true, preguntas: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const actividad = await this.prisma.actividades.findUnique({
      where: { id },
      include: {
        modulos: { include: { cursos: true } },
        preguntas: { orderBy: { orden: 'asc' } },
      },
    });
    if (!actividad) {
      throw new NotFoundException(`Actividad con id ${id} no encontrada`);
    }
    return actividad;
  }

  async update(id: number, dto: UpdateActividadDto) {
    await this.findOne(id);
    return this.prisma.actividades.update({
      where: { id },
      data: {
        modulo_id: dto.moduloId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        orden: dto.orden,
        activo: dto.activo,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.actividades.delete({ where: { id } });
  }
}
