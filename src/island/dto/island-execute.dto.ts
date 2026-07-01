import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ISLAND_SESSION_ID_PATTERN } from '../island-session.util';

export class IslandExecuteDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6789012345678abcdef01',
    description: 'Sesión de juego aislada del jugador.',
  })
  @IsString()
  @Matches(ISLAND_SESSION_ID_PATTERN, {
    message: 'sessionId no válido.',
  })
  sessionId: string;

  @ApiProperty({ example: 0, description: 'Índice del paso actual (0-based).' })
  @IsInt()
  @Min(0)
  @Max(100)
  stepIndex: number;

  @ApiProperty({
    example: "SELECT * FROM habitante WHERE estado = 'amigable'",
    description: 'Sentencia SQL para el paso actual.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  sql: string;
}
