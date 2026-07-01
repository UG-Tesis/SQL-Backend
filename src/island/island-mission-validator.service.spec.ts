import type { IslandStepDefinition } from './data/island-missions.data';
import { IslandMissionValidatorService } from './island-mission-validator.service';

describe('IslandMissionValidatorService', () => {
  const validator = new IslandMissionValidatorService();

  const selectStep: IslandStepDefinition = {
    narrative: 'test',
    kind: 'select',
    solution: "SELECT habitante_id FROM habitante WHERE estado = 'amigable'",
  };

  it('reutiliza el resultado del jugador y solo ejecuta la solución', async () => {
    const executed: string[] = [];
    const runQuery = jest.fn((sql: string) => {
      executed.push(sql);
      return Promise.resolve({
        rows: [{ habitante_id: 1 }],
        rowCount: 1,
      });
    });

    const playerResult = {
      rows: [{ habitante_id: 1 }],
      rowCount: 1,
    };

    const error = await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE estado = 'amigable'",
      runQuery,
      playerResult,
    );

    expect(error).toBeNull();
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(executed).toEqual([selectStep.solution]);
  });

  it('ejecuta jugador y solución si no hay resultado precargado', async () => {
    const runQuery = jest.fn(() =>
      Promise.resolve({
        rows: [{ habitante_id: 1 }],
        rowCount: 1,
      }),
    );

    await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE estado = 'amigable'",
      runQuery,
    );

    expect(runQuery).toHaveBeenCalledTimes(2);
  });
});
