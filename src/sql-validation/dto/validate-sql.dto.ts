import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { SqlValidationType } from '../sql-validation.types';

const VALIDATION_TYPES = [
  'create_database',
  'drop_database',
  'use_database',
  'alter_table',
  'insert_row',
  'update_row',
  'delete_row',
  'select_query',
] as const satisfies readonly SqlValidationType[];

export class ValidateSqlDto {
  @ApiProperty({
    example: 'CREATE DATABASE IF NOT EXISTS biblioteca;',
    description: 'Sentencia SQL a validar sin ejecutarla',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  sql: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID de la actividad para inferir el tipo de validación',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  actividadId?: number;

  @ApiPropertyOptional({
    enum: VALIDATION_TYPES,
    description:
      'Tipo explícito de validación (opcional si se envía actividadId)',
  })
  @IsOptional()
  @IsIn(VALIDATION_TYPES)
  validationType?: SqlValidationType;
}
