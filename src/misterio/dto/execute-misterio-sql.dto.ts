import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExecuteMisterioSqlDto {
  @ApiProperty({
    example:
      "SELECT fecha, tipo, descripcion, ciudad FROM informe_escena_crimen WHERE tipo = 'asesinato' AND ciudad = 'Ciudad SQL'",
    description:
      'Sentencia SQL a ejecutar en tesis_misterio. Solo SELECT o INSERT en solucion.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  sql: string;
}
