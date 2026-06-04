import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { inscripciones_estado } from '../../../generated/prisma/client';

export class CreateInscripcionDto {
  @ApiProperty({ example: 1, description: 'ID de la persona' })
  @IsInt()
  @Min(1)
  personaId: number;

  @ApiProperty({ example: 1, description: 'ID del curso' })
  @IsInt()
  @Min(1)
  cursoId: number;

  @ApiPropertyOptional({
    enum: inscripciones_estado,
    example: 'activo',
    description: 'Estado de la inscripción',
  })
  @IsOptional()
  @IsEnum(inscripciones_estado)
  estado?: inscripciones_estado;

  @ApiPropertyOptional({ example: 0, description: 'Porcentaje de avance (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentajeAvance?: number;
}
