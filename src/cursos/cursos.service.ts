import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCursoDto) {
    return this.prisma.cursos.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        duracion_horas: dto.duracionHoras,
        activo: dto.activo,
      },
    });
  }

  findAll() {
    return this.prisma.cursos.findMany({
      orderBy: { id: 'asc' },
      include: { modulos: true },
    });
  }

  async findOne(id: number) {
    const curso = await this.prisma.cursos.findUnique({
      where: { id },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            actividades: {
              orderBy: { orden: 'asc' },
              include: { preguntas: true },
            },
          },
        },
      },
    });
    if (!curso) {
      throw new NotFoundException(`Curso con id ${id} no encontrado`);
    }
    return curso;
  }

  async update(id: number, dto: UpdateCursoDto) {
    await this.findOne(id);
    return this.prisma.cursos.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        duracion_horas: dto.duracionHoras,
        activo: dto.activo,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.cursos.delete({ where: { id } });
  }
}
