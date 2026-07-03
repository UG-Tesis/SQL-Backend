import {
  getIslandFlatSteps,
  type IslandStepDefinition,
} from './data/island-missions.data';
import {
  compareIslandSql,
  formatIslandExpectedHint,
  solutionToSqlTemplate,
} from './island-sql-normalize';

type PlayerStepCase = {
  step: IslandStepDefinition;
  stepIndex: number;
};

describe('island-solutions.validation', () => {
  const playerSteps: PlayerStepCase[] = getIslandFlatSteps()
    .map((step, stepIndex) => ({ step, stepIndex }))
    .filter(
      ({ step }) =>
        Boolean(step.solution) &&
        !step.autoComplete &&
        step.kind !== 'narrative',
    );

  it.each(playerSteps)(
    'paso $stepIndex acepta la solución oficial',
    ({ step }) => {
      const official = `${step.solution};`;
      expect(compareIslandSql(official, step.solution!)).toEqual({
        ok: true,
        executable: step.solution,
      });
    },
  );

  it.each(playerSteps)(
    'paso $stepIndex genera pista con consulta esperada',
    ({ step }) => {
      const hint = formatIslandExpectedHint(step.solution!);
      expect(hint).toMatch(/^Consulta esperada:\n/);
      expect(hint).toContain(step.solution!.split('\n')[0]);
      expect(hint.trimEnd().endsWith(';')).toBe(true);
    },
  );

  it.each(playerSteps)(
    'paso $stepIndex genera plantilla abstracta sin nombres reales',
    ({ step }) => {
      const template = solutionToSqlTemplate(step.solution!);
      expect(template.endsWith(';')).toBe(true);
      expect(template).not.toMatch(/\bhabitante\b/i);
      expect(template).not.toMatch(/\bpueblo\b/i);
      expect(template).not.toMatch(/\bobjeto\b/i);
      expect(template).toMatch(/___/);
    },
  );
});
