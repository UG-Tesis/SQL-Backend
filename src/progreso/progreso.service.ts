import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAvanceActividadDto,
  CreateModuloEstadoDto,
  CreateProgresoModuloDto,
  UpdateAvanceActividadDto,
  UpdateModuloEstadoDto,
  UpdateProgresoModuloDto,
} from './dto/progreso.dto';

@Injectable()
export class ProgresoService {
  constructor(private readonly prisma: PrismaService) {}

  createModuloEstado(dto: CreateModuloEstadoDto) {
    return this.prisma.modulo_estado.create({
      data: {
        inscripcion_id: dto.inscripcionId,
        modulo_id: dto.moduloId,
        finalizado: dto.finalizado,
        porcentaje: dto.porcentaje,
        ...(dto.finalizado ? { fecha_finalizacion: new Date() } : {}),
      },
    });
  }

  findModulosEstado(inscripcionId?: number) {
    return this.prisma.modulo_estado.findMany({
      where: inscripcionId ? { inscripcion_id: inscripcionId } : undefined,
      include: { inscripciones: true, modulos: true },
      orderBy: { id: 'asc' },
    });
  }

  async findModuloEstado(id: number) {
    const estado = await this.prisma.modulo_estado.findUnique({
      where: { id },
      include: { inscripciones: true, modulos: true },
    });
    if (!estado) {
      throw new NotFoundException(`ModuloEstado con id ${id} no encontrado`);
    }
    return estado;
  }

  async updateModuloEstado(id: number, dto: UpdateModuloEstadoDto) {
    await this.findModuloEstado(id);
    return this.prisma.modulo_estado.update({
      where: { id },
      data: {
        finalizado: dto.finalizado,
        porcentaje: dto.porcentaje,
        ...(dto.finalizado ? { fecha_finalizacion: new Date() } : {}),
      },
    });
  }

  createProgresoModulo(dto: CreateProgresoModuloDto) {
    return this.prisma.progreso_modulos.create({
      data: {
        inscripcion_id: dto.inscripcionId,
        modulo_id: dto.moduloId,
        modulo_estado_id: dto.moduloEstadoId,
        estado: dto.estado,
        porcentaje: dto.porcentaje,
        ...(dto.estado === 'completado' ? { fecha_completado: new Date() } : {}),
      },
    });
  }

  findProgresosModulos(inscripcionId?: number) {
    return this.prisma.progreso_modulos.findMany({
      where: inscripcionId ? { inscripcion_id: inscripcionId } : undefined,
      include: {
        inscripciones: true,
        modulos: true,
        modulo_estado: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findProgresoModulo(id: number) {
    const progreso = await this.prisma.progreso_modulos.findUnique({
      where: { id },
      include: {
        inscripciones: true,
        modulos: true,
        modulo_estado: true,
      },
    });
    if (!progreso) {
      throw new NotFoundException(`ProgresoModulo con id ${id} no encontrado`);
    }
    return progreso;
  }

  async updateProgresoModulo(id: number, dto: UpdateProgresoModuloDto) {
    await this.findProgresoModulo(id);
    return this.prisma.progreso_modulos.update({
      where: { id },
      data: {
        modulo_estado_id: dto.moduloEstadoId,
        estado: dto.estado,
        porcentaje: dto.porcentaje,
        ...(dto.estado === 'completado' ? { fecha_completado: new Date() } : {}),
      },
    });
  }

  createAvanceActividad(dto: CreateAvanceActividadDto) {
    return this.prisma.avance_actividad.create({
      data: {
        inscripcion_id: dto.inscripcionId,
        actividad_id: dto.actividadId,
        finalizado: dto.finalizado,
        total_preguntas: dto.totalPreguntas,
        preguntas_respondidas: dto.preguntasRespondidas,
        porcentaje: dto.porcentaje,
      },
    });
  }

  findAvancesActividad(inscripcionId?: number) {
    return this.prisma.avance_actividad.findMany({
      where: inscripcionId ? { inscripcion_id: inscripcionId } : undefined,
      include: { inscripciones: true, actividades: true },
      orderBy: { id: 'asc' },
    });
  }

  async findAvanceActividad(id: number) {
    const avance = await this.prisma.avance_actividad.findUnique({
      where: { id },
      include: { inscripciones: true, actividades: true },
    });
    if (!avance) {
      throw new NotFoundException(`AvanceActividad con id ${id} no encontrado`);
    }
    return avance;
  }

  async updateAvanceActividad(id: number, dto: UpdateAvanceActividadDto) {
    await this.findAvanceActividad(id);
    return this.prisma.avance_actividad.update({
      where: { id },
      data: {
        finalizado: dto.finalizado,
        total_preguntas: dto.totalPreguntas,
        preguntas_respondidas: dto.preguntasRespondidas,
        porcentaje: dto.porcentaje,
      },
    });
  }
}
