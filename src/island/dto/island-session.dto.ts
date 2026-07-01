import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { ISLAND_SESSION_ID_PATTERN } from '../island-session.util';

export class IslandRestartDto {
  @ApiProperty({
    required: false,
    example: 'a1b2c3d4e5f6789012345678abcdef01',
    description:
      'Sesión existente. Si se omite, se crea un clon nuevo de la base plantilla.',
  })
  @IsOptional()
  @IsString()
  @Matches(ISLAND_SESSION_ID_PATTERN, {
    message: 'sessionId no válido.',
  })
  sessionId?: string;
}

export class IslandCloseSessionDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6789012345678abcdef01',
    description: 'Sesión de juego a cerrar y eliminar de MySQL.',
  })
  @IsString()
  @Matches(ISLAND_SESSION_ID_PATTERN, {
    message: 'sessionId no válido.',
  })
  sessionId: string;
}
