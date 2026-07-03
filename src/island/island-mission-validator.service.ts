import { Injectable } from '@nestjs/common';
import type { IslandStepDefinition } from './data/island-missions.data';
import {
  compareIslandSql,
  formatIslandExpectedHint,
} from './island-sql-normalize';
import type { IslandStepValidationError } from './island-step-validation.types';

export type { IslandStepValidationError } from './island-step-validation.types';

type QueryRunner = (sql: string) => Promise<{
  rows: Record<string, unknown>[];
  rowCount: number;
}>;

@Injectable()
export class IslandMissionValidatorService {
  async validateStep(
    step: IslandStepDefinition,
    playerSql: string,
    runQuery: QueryRunner,
  ): Promise<IslandStepValidationError | null> {
    if (step.kind === 'narrative') {
      return null;
    }

    if (!step.solution) {
      return {
        message: 'Falta la solución de referencia para este paso.',
        showStepHint: false,
      };
    }

    const comparison = compareIslandSql(playerSql, step.solution);
    if (!comparison.ok) {
      return {
        message: comparison.message,
        showStepHint: comparison.mismatch,
        hint: comparison.hint,
      };
    }

    if (step.kind === 'dml') {
      return this.validateDmlEffect(step, runQuery);
    }

    return null;
  }

  private async validateDmlEffect(
    step: IslandStepDefinition,
    runQuery: QueryRunner,
  ): Promise<IslandStepValidationError | null> {
    if (!step.verificationQuery || step.verificationCount === undefined) {
      return null;
    }

    try {
      const verification = await runQuery(step.verificationQuery);
      if (verification.rowCount === step.verificationCount) {
        return null;
      }
      return {
        message: 'Demasiados o muy pocos cambios. Revisa tu sentencia.',
        showStepHint: true,
        hint: step.solution
          ? formatIslandExpectedHint(step.solution)
          : undefined,
      };
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : 'Error al verificar los cambios.',
        showStepHint: false,
      };
    }
  }
}
