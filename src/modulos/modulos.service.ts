import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@Injectable()
export class ModulosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateModuloDto) {
    return this.prisma.modulos.create({
      data: {
        curso_id: dto.cursoId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        orden: dto.orden,
        duracion_horas: dto.duracionHoras,
      },
    });
  }

  findAll(cursoId?: number) {
    return this.prisma.modulos.findMany({
      where: cursoId ? { curso_id: cursoId } : undefined,
      include: { cursos: true, actividades: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const modulo = await this.prisma.modulos.findUnique({
      where: { id },
      include: {
        cursos: true,
        actividades: {
          orderBy: { orden: 'asc' },
          include: { preguntas: true },
        },
      },
    });
    if (!modulo) {
      throw new NotFoundException(`Modulo con id ${id} no encontrado`);
    }
    return modulo;
  }

  async update(id: number, dto: UpdateModuloDto) {
    await this.findOne(id);
    return this.prisma.modulos.update({
      where: { id },
      data: {
        curso_id: dto.cursoId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        orden: dto.orden,
        duracion_horas: dto.duracionHoras,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.modulos.delete({ where: { id } });
  }
}
