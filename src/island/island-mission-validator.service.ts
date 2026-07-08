import { Injectable } from '@nestjs/common';
import type { IslandStepDefinition } from './data/island-missions.data';
import {
  compareIslandResultSets,
  describeIslandResultSetMismatch,
  type IslandQueryResult,
} from './island-result-set-compare';
import {
  formatIslandExpectedHint,
  parseIslandPlayerSql,
} from './island-sql-normalize';
import { stripOrderByClause } from './island.validation';
import type { IslandStepValidationError } from './island-step-validation.types';

export type { IslandStepValidationError } from './island-step-validation.types';

type QueryRunner = (sql: string) => Promise<IslandQueryResult>;

@Injectable()
export class IslandMissionValidatorService {
  async validateStep(
    step: IslandStepDefinition,
    playerSql: string,
    playerResult: IslandQueryResult,
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

    const formatError = this.validateSqlFormat(playerSql);
    if (formatError) {
      return formatError;
    }

    if (step.kind === 'dml') {
      return this.validateDmlEffect(step, runQuery);
    }

    return this.validateSelectResult(step, playerResult, runQuery);
  }

  private validateSqlFormat(
    playerSql: string,
  ): IslandStepValidationError | null {
    try {
      parseIslandPlayerSql(playerSql);
      return null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sentencia SQL no válida.';
      return {
        message,
        showStepHint: false,
      };
    }
  }

  private async validateSelectResult(
    step: IslandStepDefinition,
    playerResult: IslandQueryResult,
    runQuery: QueryRunner,
  ): Promise<IslandStepValidationError | null> {
    const hint = formatIslandExpectedHint(step.solution!);

    try {
      const solutionResult = await runQuery(stripOrderByClause(step.solution!));
      const comparison = compareIslandResultSets(playerResult, solutionResult);
      if (comparison.ok) {
        return null;
      }

      return {
        message: describeIslandResultSetMismatch(comparison.kind),
        showStepHint: true,
        hint,
      };
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : 'Error al verificar el resultado de la consulta.',
        showStepHint: false,
      };
    }
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
