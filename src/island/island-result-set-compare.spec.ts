import {
  compareIslandResultSets,
  describeIslandResultSetMismatch,
} from './island-result-set-compare';

describe('island-result-set-compare', () => {
  it('acepta conjuntos idénticos sin importar el orden de filas', () => {
    const player = {
      rows: [
        { nombre: 'Ana', oro: 100 },
        { nombre: 'Luis', oro: 50 },
      ],
      rowCount: 2,
    };
    const expected = {
      rows: [
        { nombre: 'Luis', oro: 50 },
        { nombre: 'Ana', oro: 100 },
      ],
      rowCount: 2,
    };

    expect(compareIslandResultSets(player, expected)).toEqual({ ok: true });
  });

  it('respeta preserveOrder cuando el paso lo exige', () => {
    const player = {
      rows: [{ nombre: 'Ana' }, { nombre: 'Luis' }],
      rowCount: 2,
    };
    const expected = {
      rows: [{ nombre: 'Luis' }, { nombre: 'Ana' }],
      rowCount: 2,
    };

    expect(
      compareIslandResultSets(player, expected, { preserveOrder: true }),
    ).toEqual({ ok: false, kind: 'wrongRows' });
  });

  it('detecta columnas distintas', () => {
    const player = {
      rows: [{ nombre: 'Ana' }],
      rowCount: 1,
    };
    const expected = {
      rows: [{ nombre: 'Ana', oro: 10 }],
      rowCount: 1,
    };

    expect(compareIslandResultSets(player, expected)).toEqual({
      ok: false,
      kind: 'columnCount',
    });
  });

  it('describe mensajes de error legibles', () => {
    expect(describeIslandResultSetMismatch('tooManyRows')).toContain(
      'demasiadas',
    );
  });
});
