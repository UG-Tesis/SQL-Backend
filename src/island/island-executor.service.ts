import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  FieldPacket,
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import type { SqlExecutionResult } from '../sql-executor/sql-executor.service';
import {
  getIslandFlatSteps,
  getIslandMissionProgress,
  getIslandStep,
  getIslandStepCount,
  type IslandStepDefinition,
} from './data/island-missions.data';
import { IslandMissionValidatorService } from './island-mission-validator.service';
import { IslandSessionService } from './island-session.service';
import { assertIslandSqlAllowed } from './island.validation';

export interface IslandMissionProgress {
  missionId: number;
  missionTitle: string;
  missionIndex: number;
  stepInMission: number;
  stepsInMission: number;
  totalMissions: number;
  currentStep: number;
  totalSteps: number;
}

export interface IslandActionResult extends SqlExecutionResult {
  code: -1 | 0 | 1;
  stepComplete: boolean;
  gameComplete: boolean;
  narrative?: string;
  answer?: string;
  followUp?: string;
  hint?: string;
  demoSql?: string;
  progress: IslandMissionProgress | null;
  nextStepIndex: number | null;
}

const MAX_SELECT_ROWS = 200;
const RESET_SQL = `
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE objeto;
TRUNCATE TABLE habitante;
TRUNCATE TABLE pueblo;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO pueblo (pueblo_id, nombre, jefe) VALUES
  (1, 'Ciudad Mono', NULL),
  (2, 'Pueblo Pepino', NULL),
  (3, 'Villa Cebolla', NULL);

INSERT INTO habitante (habitante_id, nombre, pueblo_id, genero, profesion, oro, estado) VALUES
  (1, 'Pablo Panadero', 1, 'm', 'Panadero', 850, 'amigable'),
  (2, 'Ernesto Herrero', 3, 'm', 'Armero', 280, 'amigable'),
  (3, 'Rita Vaca', 1, 'f', 'Panadero', 350, 'amigable'),
  (4, 'Carlos Vaca', 1, 'm', 'Comerciante', 250, 'amigable'),
  (5, 'Dieter Sucio', 3, 'm', 'Herrero', 650, 'hostil'),
  (6, 'Gerd Carnicero', 2, 'm', 'Carnicero', 4850, 'hostil'),
  (7, 'Pedro Carnicero', 3, 'm', 'Carnicero', 3250, 'hostil'),
  (8, 'Arturo Piloto', 2, 'm', 'Piloto', 490, 'prisionero'),
  (9, 'Tania Tambor', 1, 'f', 'Panadero', 550, 'hostil'),
  (10, 'Pedro Tambor', 1, 'm', 'Herrero', 600, 'amigable'),
  (11, 'Dorotea Sucia', 3, 'f', 'Cosechadora', 10, 'hostil'),
  (12, 'Otto Lámpara', 2, 'm', 'Mercader', 680, 'amigable'),
  (13, 'Fritz Poeta', 3, 'm', 'Narrador', 420, 'amigable'),
  (14, 'Enrico Zimmermann', 3, 'm', 'Armero', 510, 'hostil'),
  (15, 'Helga Césped', 2, 'f', 'Mercader', 680, 'amigable'),
  (16, 'Irene Sombrerera', 1, 'f', 'Mercader', 770, 'hostil'),
  (17, 'Erich Césped', 3, 'm', 'Carnicero', 990, 'amigable'),
  (18, 'Rodolfo Cascos', 3, 'm', 'Herrero de cascos', 390, 'amigable'),
  (19, 'Ana Mosca', 2, 'f', 'Carnicero', 2280, 'amigable');

INSERT INTO objeto (nombre, propietario) VALUES
  ('Tetera', NULL),
  ('Bastón', 5),
  ('Martillo', 2),
  ('Anillo', NULL),
  ('Taza de café', NULL),
  ('Cubo', NULL),
  ('Cuerda', 17),
  ('Caja de cartón', NULL),
  ('Bombilla', NULL);

UPDATE pueblo SET jefe = 1 WHERE pueblo_id = 1;
UPDATE pueblo SET jefe = 6 WHERE pueblo_id = 2;
UPDATE pueblo SET jefe = 13 WHERE pueblo_id = 3;
`;

@Injectable()
export class IslandExecutorService {
  private readonly restartInFlight = new Map<
    string,
    Promise<{ success: true; message: string; sessionId: string }>
  >();

  constructor(
    private readonly sessionService: IslandSessionService,
    private readonly missionValidator: IslandMissionValidatorService,
  ) {}

  getCatalog() {
    return {
      missions: getIslandFlatSteps().length,
      totalSteps: getIslandStepCount(),
    };
  }

  getStepInfo(stepIndex: number) {
    const step = getIslandStep(stepIndex);
    if (!step) {
      throw new BadRequestException('Paso de juego no válido.');
    }

    return {
      narrative: step.narrative,
      hint: step.hint,
      kind: step.kind,
      autoComplete: step.autoComplete === true,
      progress: this.buildProgress(stepIndex),
    };
  }

  async restart(
    sessionId?: string,
  ): Promise<{ success: true; message: string; sessionId: string }> {
    const restartKey = sessionId ?? '__new__';
    const inFlight = this.restartInFlight.get(restartKey);
    if (inFlight) {
      return inFlight;
    }

    const operation = sessionId
      ? this.runRestart(sessionId)
      : this.runCreateSession();

    const promise = operation.finally(() => {
      this.restartInFlight.delete(restartKey);
    });

    this.restartInFlight.set(restartKey, promise);
    return promise;
  }

  private async runCreateSession(): Promise<{
    success: true;
    message: string;
    sessionId: string;
  }> {
    const { sessionId } = await this.sessionService.createSession();
    return {
      success: true,
      sessionId,
      message:
        'Partida iniciada. Se creó una copia privada de la base de datos del juego.',
    };
  }

  private async runRestart(
    sessionId: string,
  ): Promise<{ success: true; message: string; sessionId: string }> {
    const pool = this.sessionService.getSessionPool(sessionId);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('TRUNCATE TABLE objeto');
      await connection.query('TRUNCATE TABLE habitante');
      await connection.query('TRUNCATE TABLE pueblo');

      for (const statement of RESET_SQL.split(';')
        .map((s) => s.trim())
        .filter(Boolean)) {
        if (statement.startsWith('SET FOREIGN_KEY_CHECKS')) continue;
        if (statement.startsWith('TRUNCATE TABLE')) continue;
        await connection.query(statement);
      }

      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.commit();
      return {
        success: true,
        sessionId,
        message:
          'Partida reiniciada. La base de datos de tu sesión volvió al estado inicial.',
      };
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        /* ignore */
      }
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo reiniciar la partida.';
      throw new BadRequestException(message);
    } finally {
      connection.release();
    }
  }

  async continue(
    sessionId: string,
    stepIndex: number,
  ): Promise<IslandActionResult> {
    const step = this.getValidStep(stepIndex);
    if (!step.autoComplete) {
      throw new BadRequestException('Este paso requiere una consulta SQL.');
    }

    let execution: SqlExecutionResult = {
      success: true,
      rows: [],
      rowCount: 0,
      columns: [],
      message: 'Continuaste la historia.',
    };

    if (step.demoSql) {
      const isSelect = /^\s*SELECT\b/i.test(step.demoSql.trim());
      execution = await this.runStatement(sessionId, step.demoSql, isSelect);
    }

    return this.buildStepSuccess(stepIndex, step, execution);
  }

  async executeSql(
    sessionId: string,
    stepIndex: number,
    sql: string,
  ): Promise<IslandActionResult> {
    const step = this.getValidStep(stepIndex);

    if (step.autoComplete) {
      throw new BadRequestException(
        'Este paso se completa con el botón Continuar.',
      );
    }

    const statement = this.validateAndNormalize(sql);
    const isSelect = /^\s*SELECT\b/i.test(statement);
    const isDml = !isSelect;

    if (step.kind === 'select' && !isSelect) {
      throw new BadRequestException('Este paso requiere una consulta SELECT.');
    }

    if (step.kind === 'dml' && isSelect) {
      throw new BadRequestException(
        'Este paso requiere INSERT, UPDATE o DELETE.',
      );
    }

    const pool = this.sessionService.getSessionPool(sessionId);
    const connection = await pool.getConnection();

    try {
      if (isDml) {
        await connection.beginTransaction();
      }

      const execution = await this.runStatementOnConnection(
        connection,
        statement,
        isSelect,
      );

      const validationError = await this.missionValidator.validateStep(
        step,
        statement,
        async (query) => {
          const [rows, fields] = await connection.query<RowDataPacket[]>(query);
          return {
            rows: rows.map((row) => this.serializeRow(row)),
            rowCount: rows.length,
            columns: this.mapColumns(fields),
          };
        },
        isSelect
          ? { rows: execution.rows, rowCount: execution.rowCount }
          : undefined,
      );

      if (validationError) {
        if (isDml) {
          await connection.rollback();
        }
        return {
          ...execution,
          code: -1,
          success: false,
          message: validationError,
          stepComplete: false,
          gameComplete: false,
          progress: this.buildProgress(stepIndex),
          nextStepIndex: null,
        };
      }

      if (isDml) {
        await connection.commit();
      }

      return this.buildStepSuccess(stepIndex, step, execution);
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        /* ignore */
      }
      const message =
        error instanceof Error ? error.message : 'Error al ejecutar SQL';
      throw new BadRequestException(message);
    } finally {
      connection.release();
    }
  }

  private buildStepSuccess(
    stepIndex: number,
    step: IslandStepDefinition,
    execution: SqlExecutionResult,
  ): IslandActionResult {
    const nextStepIndex = stepIndex + 1;
    const gameComplete = nextStepIndex >= getIslandStepCount();

    return {
      ...execution,
      code: 1,
      success: true,
      message: '¡Correcto!',
      stepComplete: true,
      gameComplete,
      answer: step.answer,
      followUp: step.followUp,
      hint: step.hint,
      demoSql: step.demoSql,
      progress: this.buildProgress(stepIndex),
      nextStepIndex: gameComplete ? null : nextStepIndex,
    };
  }

  private buildProgress(stepIndex: number): IslandMissionProgress | null {
    const mission = getIslandMissionProgress(stepIndex);
    if (!mission) {
      return null;
    }

    return {
      ...mission,
      currentStep: stepIndex + 1,
      totalSteps: getIslandStepCount(),
    };
  }

  private getValidStep(stepIndex: number): IslandStepDefinition {
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      throw new BadRequestException('Índice de paso no válido.');
    }
    const step = getIslandStep(stepIndex);
    if (!step) {
      throw new BadRequestException('Ya completaste todas las misiones.');
    }
    return step;
  }

  private async runStatement(
    sessionId: string,
    sql: string,
    isSelect: boolean,
  ): Promise<SqlExecutionResult> {
    const pool = this.sessionService.getSessionPool(sessionId);
    const connection = await pool.getConnection();
    try {
      return this.runStatementOnConnection(connection, sql, isSelect);
    } finally {
      connection.release();
    }
  }

  private async runStatementOnConnection(
    connection: Awaited<ReturnType<Pool['getConnection']>>,
    sql: string,
    isSelect: boolean,
  ): Promise<SqlExecutionResult> {
    const limited = isSelect ? this.applySelectRowLimit(sql) : sql;
    const [result, fields] = await connection.query<
      RowDataPacket[] | ResultSetHeader
    >(limited);

    if (Array.isArray(result)) {
      const rows = result.map((row) => this.serializeRow(row));
      return {
        success: true,
        rows,
        rowCount: rows.length,
        columns: this.mapColumns(fields),
        message:
          rows.length === 0
            ? 'Consulta ejecutada sin registros.'
            : `Consulta ejecutada. ${rows.length} registro(s).`,
      };
    }

    const header = result;
    return {
      success: true,
      rows: [],
      rowCount: 0,
      columns: [],
      affectedRows: header.affectedRows,
      insertId: header.insertId > 0 ? header.insertId : undefined,
      message: `Sentencia ejecutada. Filas afectadas: ${header.affectedRows ?? 0}.`,
    };
  }

  private validateAndNormalize(sql: string): string {
    const trimmed = sql.trim();
    if (!trimmed) {
      throw new BadRequestException('La sentencia SQL no puede estar vacía.');
    }

    if (trimmed.length > 4000) {
      throw new BadRequestException(
        'La sentencia SQL supera el tamaño permitido.',
      );
    }

    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    const sanitized = withoutComments.replace(/;+\s*$/g, '').trim();
    if (!sanitized) {
      throw new BadRequestException('La sentencia SQL no puede estar vacía.');
    }

    if (sanitized.includes(';')) {
      throw new BadRequestException(
        'Solo se permite ejecutar una sentencia SQL a la vez.',
      );
    }

    try {
      assertIslandSqlAllowed(sanitized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operación no permitida.';
      throw new BadRequestException(message);
    }

    return sanitized;
  }

  private applySelectRowLimit(statement: string): string {
    const checkTarget = statement
      .replace(/'([^'\\]|\\.)*'/g, "''")
      .replace(/"([^"\\]|\\.)*"/g, '""')
      .replace(/`([^`\\]|\\.)*`/g, '``')
      .trim();

    if (!/^\s*SELECT\b/i.test(checkTarget) || /\bLIMIT\b/i.test(checkTarget)) {
      return statement;
    }

    return `${statement} LIMIT ${MAX_SELECT_ROWS}`;
  }

  private mapColumns(fields?: FieldPacket[]) {
    if (!fields?.length) return [];
    return fields.map((field) => ({
      name: field.name,
      type: String(field.type ?? 'unknown'),
    }));
  }

  private serializeRow(row: RowDataPacket): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      output[key] = this.serializeValue(value);
    }
    return output;
  }

  private serializeValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    if (typeof value === 'bigint') return value.toString();
    return value;
  }
}
