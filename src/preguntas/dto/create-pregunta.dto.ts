import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePreguntaDto {
  @IsInt()
  @Min(1)
  actividadId: number;

  @IsString()
  @IsNotEmpty()
  pregunta: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
