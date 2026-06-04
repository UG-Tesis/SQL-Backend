import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModuloDto {
  @IsInt()
  @Min(1)
  cursoId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsInt()
  @Min(1)
  orden: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionHoras?: number;
}
