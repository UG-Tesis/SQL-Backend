import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { progreso_modulos_estado } from '../../../generated/prisma/client';

export class CreateModuloEstadoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  inscripcionId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  moduloId: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  finalizado?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje?: number;
}

export class UpdateModuloEstadoDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  finalizado?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje?: number;
}

export class CreateProgresoModuloDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  inscripcionId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  moduloId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  moduloEstadoId?: number;

  @ApiPropertyOptional({
    enum: progreso_modulos_estado,
    example: 'pendiente',
  })
  @IsOptional()
  @IsEnum(progreso_modulos_estado)
  estado?: progreso_modulos_estado;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  porcentaje?: number;
}

export class UpdateProgresoModuloDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  moduloEstadoId?: number;

  @ApiPropertyOptional({
    enum: progreso_modulos_estado,
    example: 'en_progreso',
  })
  @IsOptional()
  @IsEnum(progreso_modulos_estado)
  estado?: progreso_modulos_estado;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  porcentaje?: number;
}

export class CreateAvanceActividadDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  inscripcionId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  actividadId: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  finalizado?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPreguntas?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  preguntasRespondidas?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje?: number;
}

export class UpdateAvanceActividadDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  finalizado?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPreguntas?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  preguntasRespondidas?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje?: number;
}
