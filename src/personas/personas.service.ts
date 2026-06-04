import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePersonaDto) {
    return this.prisma.personas.create({ data: dto });
  }

  findAll() {
    return this.prisma.personas.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const persona = await this.prisma.personas.findUnique({
      where: { id },
      include: {
        inscripciones: { include: { cursos: true } },
      },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con id ${id} no encontrada`);
    }
    return persona;
  }

  async update(id: number, dto: UpdatePersonaDto) {
    await this.findOne(id);
    return this.prisma.personas.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.personas.delete({ where: { id } });
  }
}
