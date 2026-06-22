import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerificarSolucionDto {
  @ApiProperty({
    example: 'Jeremías Bowers',
    description: 'Nombre del sospechoso que el estudiante cree responsable del crimen',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;
}
