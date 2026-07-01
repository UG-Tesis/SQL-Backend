import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { ISLAND_SESSION_ID_PATTERN } from '../island-session.util';

export class IslandContinueDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6789012345678abcdef01',
    description: 'Sesión de juego aislada del jugador.',
  })
  @IsString()
  @Matches(ISLAND_SESSION_ID_PATTERN, {
    message: 'sessionId no válido.',
  })
  sessionId: string;

  @ApiProperty({
    example: 0,
    description: 'Índice del paso narrativo actual (0-based).',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  stepIndex: number;
}
