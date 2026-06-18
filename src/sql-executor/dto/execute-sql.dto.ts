import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExecuteSqlDto {
  @ApiProperty({
    example: 'SELECT * FROM practica_clientes LIMIT 10',
    description: 'Sentencia SQL a ejecutar en la base de datos del curso',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  sql: string;
}
