import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ISLAND_MISSIONS } from './data/island-missions.data';
import { IslandContinueDto } from './dto/island-continue.dto';
import { IslandExecuteDto } from './dto/island-execute.dto';
import {
  IslandCloseSessionDto,
  IslandRestartDto,
} from './dto/island-session.dto';
import {
  IslandExecutorService,
  type IslandActionResult,
} from './island-executor.service';
import { IslandSessionService } from './island-session.service';

@ApiTags('island')
@Controller('island')
export class IslandController {
  constructor(
    private readonly islandExecutorService: IslandExecutorService,
    private readonly islandSessionService: IslandSessionService,
  ) {}

  @Get('missions')
  @ApiOperation({ summary: 'Catálogo de misiones SQL Island' })
  getMissions() {
    return {
      missions: ISLAND_MISSIONS.map((mission) => ({
        id: mission.id,
        title: mission.title,
        summary: mission.summary,
        steps: mission.steps.length,
      })),
      totalSteps: ISLAND_MISSIONS.reduce(
        (acc, mission) => acc + mission.steps.length,
        0,
      ),
    };
  }

  @Post('restart')
  @ApiOperation({
    summary:
      'Iniciar sesión nueva (clon de tesis_island) o reiniciar datos de una sesión existente',
  })
  restart(@Body() dto: IslandRestartDto) {
    return this.islandExecutorService.restart(dto.sessionId);
  }

  @Post('session/resume')
  @ApiOperation({
    summary:
      'Reanudar una sesión existente sin clonar de nuevo la base de datos',
  })
  resume(@Body() dto: IslandCloseSessionDto) {
    return this.islandSessionService.resumeSession(dto.sessionId);
  }

  @Post('session/close')
  @ApiOperation({
    summary: 'Cerrar sesión y eliminar la base clonada del jugador',
  })
  closeSession(@Body() dto: IslandCloseSessionDto) {
    return this.islandSessionService.closeSession(dto.sessionId).then(() => ({
      success: true,
      message: 'Sesión cerrada y base de datos del jugador eliminada.',
    }));
  }

  @Post('continue')
  @ApiOperation({ summary: 'Avanzar un paso narrativo automático' })
  @ApiOkResponse({ description: 'Resultado del paso' })
  continue(@Body() dto: IslandContinueDto): Promise<IslandActionResult> {
    return this.islandExecutorService.continue(dto.sessionId, dto.stepIndex);
  }

  @Post('sql/execute')
  @ApiOperation({ summary: 'Ejecutar SQL en el paso actual de SQL Island' })
  @ApiOkResponse({ description: 'Resultado de la ejecución y validación' })
  executeSql(@Body() dto: IslandExecuteDto): Promise<IslandActionResult> {
    return this.islandExecutorService.executeSql(
      dto.sessionId,
      dto.stepIndex,
      dto.sql,
    );
  }
}
