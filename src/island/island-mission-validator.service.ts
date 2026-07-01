import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type { IslandStepDefinition } from './data/island-missions.data';
import { stripOrderByClause } from './island.validation';

type QueryRunner = (sql: string) => Promise<{
  rows: Record<string, unknown>[];
  rowCount: number;
}>;

export interface IslandPrefetchedPlayerResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

@Injectable()
export class IslandMissionValidatorService {
  async validateStep(
    step: IslandStepDefinition,
    playerSql: string,
    runQuery: QueryRunner,
    playerResult?: IslandPrefetchedPlayerResult,
  ): Promise<string | null> {
    if (step.kind === 'narrative') {
      return null;
    }

    if (step.kind === 'select' && step.solution) {
      return this.validateSelect(step, playerSql, runQuery, playerResult);
    }

    if (step.kind === 'dml') {
      return this.validateDml(step, runQuery);
    }

    return 'Este paso no tiene validación configurada.';
  }

  private async validateSelect(
    step: IslandStepDefinition,
    playerSql: string,
    runQuery: QueryRunner,
    playerResult?: IslandPrefetchedPlayerResult,
  ): Promise<string | null> {
    if (!step.solution) {
      return 'Falta la solución de referencia para este paso.';
    }

    const solutionQuery = step.preserveOrder
      ? step.solution.trim()
      : stripOrderByClause(step.solution);

    try {
      const [resolvedPlayerResult, solutionResult] = await Promise.all([
        playerResult
          ? Promise.resolve(playerResult)
          : runQuery(
              step.preserveOrder
                ? playerSql.trim()
                : stripOrderByClause(playerSql),
            ),
        runQuery(solutionQuery),
      ]);

      const playerSerialized = this.serializeRows(
        resolvedPlayerResult.rows,
        step.preserveOrder === true,
      );
      const solutionSerialized = this.serializeRows(
        solutionResult.rows,
        step.preserveOrder === true,
      );

      const missing = solutionSerialized.filter(
        (row) => !playerSerialized.includes(row),
      );
      const extra = playerSerialized.filter(
        (row) => !solutionSerialized.includes(row),
      );

      if (missing.length > 0 && extra.length > 0) {
        return this.caseHint(
          'Hay filas incorrectas en tu resultado.',
          playerSql,
        );
      }
      if (missing.length > 0) {
        return this.caseHint(
          'Faltan algunas filas en tu resultado.',
          playerSql,
        );
      }
      if (extra.length > 0) {
        return this.caseHint('Tu consulta devuelve filas de más.', playerSql);
      }

      return null;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al validar la consulta.';
      if (message.toLowerCase().includes('column')) {
        return 'Las columnas del resultado no coinciden con lo esperado.';
      }
      return message;
    }
  }

  private async validateDml(
    step: IslandStepDefinition,
    runQuery: QueryRunner,
  ): Promise<string | null> {
    if (!step.verificationQuery || step.verificationCount === undefined) {
      return 'Falta la verificación para este paso DML.';
    }

    try {
      const verification = await runQuery(step.verificationQuery);
      if (verification.rowCount === step.verificationCount) {
        return null;
      }
      return 'Demasiados o muy pocos cambios. Revisa tu sentencia.';
    } catch (error) {
      return error instanceof Error
        ? error.message
        : 'Error al verificar los cambios.';
    }
  }

  private serializeRows(
    rows: RowDataPacket[] | Record<string, unknown>[],
    preserveOrder: boolean,
  ): string[] {
    const serialized = rows.map((row) =>
      JSON.stringify(this.normalizeRow(row as Record<string, unknown>)),
    );
    return preserveOrder ? serialized : [...serialized].sort();
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(row).sort()) {
      const value = row[key];
      if (value === null || value === undefined) {
        normalized[key] = null;
      } else if (typeof value === 'bigint') {
        normalized[key] = value.toString();
      } else if (value instanceof Date) {
        normalized[key] = value.toISOString();
      } else if (Buffer.isBuffer(value)) {
        normalized[key] = value.toString('utf8');
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }

  private caseHint(base: string, sql: string): string {
    if (/WHERE/i.test(sql) && /'[^']*[a-z][^']*'/i.test(sql)) {
      return `${base} Revisa mayúsculas y minúsculas en los valores entre comillas.`;
    }
    return base;
  }
}
