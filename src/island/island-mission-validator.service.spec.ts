import type { IslandStepDefinition } from './data/island-missions.data';
import { IslandMissionValidatorService } from './island-mission-validator.service';

describe('IslandMissionValidatorService', () => {
  const validator = new IslandMissionValidatorService();

  const selectStep: IslandStepDefinition = {
    narrative: 'test',
    kind: 'select',
    solution: "SELECT habitante_id FROM habitante WHERE nombre = 'Extranjero'",
  };

  const playerIdResult = {
    rows: [{ habitante_id: 20 }],
    rowCount: 1,
  };

  it('acepta el mismo conjunto de filas que la solución oficial', async () => {
    const runQuery = jest.fn(() => Promise.resolve(playerIdResult));

    const error = await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE nombre = 'Extranjero';",
      playerIdResult,
      runQuery,
    );

    expect(error).toBeNull();
    expect(runQuery).toHaveBeenCalledWith(
      "SELECT habitante_id FROM habitante WHERE nombre = 'Extranjero'",
    );
  });

  it('rechaza columnas distintas aunque el dato sea correcto (como SQL Island)', async () => {
    const runQuery = jest.fn(() => Promise.resolve(playerIdResult));

    const error = await validator.validateStep(
      selectStep,
      "SELECT * FROM habitante WHERE nombre = 'Extranjero';",
      {
        rows: [
          {
            habitante_id: 20,
            nombre: 'Extranjero',
            pueblo_id: 1,
            genero: '?',
            profesion: '?',
            oro: 0,
            estado: '?',
          },
        ],
        rowCount: 1,
      },
      runQuery,
    );

    expect(error?.showStepHint).toBe(true);
    expect(error?.message).toContain('columnas');
  });

  it('acepta sintaxis distinta si el resultado coincide (p. ej. JOIN)', async () => {
    const joinStep: IslandStepDefinition = {
      narrative: 'test',
      kind: 'select',
      solution:
        "SELECT habitante.nombre FROM pueblo, habitante WHERE pueblo.jefe = habitante.habitante_id AND pueblo.nombre = 'Villa Cebolla'",
    };
    const chiefResult = {
      rows: [{ nombre: 'Fritz Poeta' }],
      rowCount: 1,
    };

    const runQuery = jest.fn(() => Promise.resolve(chiefResult));

    const error = await validator.validateStep(
      joinStep,
      "SELECT h.nombre FROM pueblo p JOIN habitante h ON p.jefe = h.habitante_id WHERE p.nombre = 'Villa Cebolla';",
      chiefResult,
      runQuery,
    );

    expect(error).toBeNull();
  });

  it('rechaza resultados incorrectos con pista', async () => {
    const runQuery = jest.fn(() =>
      Promise.resolve({
        rows: [{ habitante_id: 99 }],
        rowCount: 1,
      }),
    );

    const error = await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE nombre = 'Otro';",
      { rows: [{ habitante_id: 1 }], rowCount: 1 },
      runQuery,
    );

    expect(error?.showStepHint).toBe(true);
    expect(error?.message).toContain('filas');
    expect(error?.hint).toContain('SELECT habitante_id FROM habitante');
  });

  it('acepta consultas sin punto y coma', async () => {
    const runQuery = jest.fn(() => Promise.resolve(playerIdResult));

    const error = await validator.validateStep(
      selectStep,
      "SELECT habitante_id FROM habitante WHERE nombre = 'Extranjero'",
      playerIdResult,
      runQuery,
    );

    expect(error).toBeNull();
  });

  it('acepta DML por efecto sin exigir texto idéntico', async () => {
    const dmlStep: IslandStepDefinition = {
      narrative: 'test',
      kind: 'dml',
      solution: "UPDATE habitante SET nombre = 'Pedro' WHERE habitante_id = 20",
      verificationQuery: "SELECT * FROM habitante WHERE nombre = 'Extranjero'",
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
      "UPDATE habitante SET nombre = 'Pedro' WHERE nombre = 'Extranjero';",
      { rows: [], rowCount: 0 },
      runQuery,
    );

    expect(error).toBeNull();
    expect(runQuery).toHaveBeenCalledWith(dmlStep.verificationQuery);
  });
});
