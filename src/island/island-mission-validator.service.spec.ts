import type { IslandStepDefinition } from './data/island-missions.data';
import { IslandMissionValidatorService } from './island-mission-validator.service';

describe('IslandMissionValidatorService', () => {
  const validator = new IslandMissionValidatorService();

  const selectStep: IslandStepDefinition = {
    narrative: 'test',
    kind: 'select',
    solution: "SELECT habitante_id FROM habitante WHERE estado = 'amigable'",
  };

  it('acepta la consulta oficial con variación de mayúsculas y punto y coma', async () => {
    const runQuery = jest.fn();

    const error = await validator.validateStep(
      selectStep,
      "select habitante_id from habitante where estado = 'amigable';",
      runQuery,
    );

    expect(error).toBeNull();
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('rechaza consultas distintas y pide pista inmediata', async () => {
    const error = await validator.validateStep(
      selectStep,
      "SELECT * FROM habitante WHERE estado = 'amigable';",
      jest.fn(),
    );

    expect(error?.showStepHint).toBe(true);
    expect(error?.message).toContain('columnas');
    expect(error?.hint).toContain('SELECT habitante_id FROM habitante');
  });

  it('rechaza formato inválido sin activar pista del paso', async () => {
    const error = await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE estado = 'amigable'",
      jest.fn(),
    );

    expect(error).toEqual({
      message: 'Termina la sentencia con punto y coma (;).',
      showStepHint: false,
    });
  });

  it('verifica el efecto DML tras coincidencia de texto', async () => {
    const dmlStep: IslandStepDefinition = {
      narrative: 'test',
      kind: 'dml',
      solution: "DELETE FROM habitante WHERE nombre = 'Dieter Sucio'",
      verificationQuery:
        "SELECT * FROM habitante WHERE nombre = 'Dieter Sucio'",
      verificationCount: 0,
    };

    const runQuery = jest.fn(() =>
      Promise.resolve({
        rows: [],
        rowCount: 0,
      }),
    );

    const error = await validator.validateStep(
      dmlStep,
      "DELETE FROM habitante WHERE nombre = 'Dieter Sucio';",
      runQuery,
    );

    expect(error).toBeNull();
    expect(runQuery).toHaveBeenCalledWith(dmlStep.verificationQuery);
  });
});
