export interface IslandQueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export type IslandResultSetMismatchKind =
  | 'columnCount'
  | 'tooManyRows'
  | 'tooFewRows'
  | 'wrongRows';

export type IslandResultSetCompareResult =
  | { ok: true }
  | { ok: false; kind: IslandResultSetMismatchKind };

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(10);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '';
}

function rowToValues(row: Record<string, unknown>): string[] {
  return Object.keys(row).map((key) => normalizeCell(row[key]));
}

function sortRows(rows: string[][]): string[][] {
  return [...rows].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
}

export function compareIslandResultSets(
  player: IslandQueryResult,
  expected: IslandQueryResult,
  options: { preserveOrder?: boolean } = {},
): IslandResultSetCompareResult {
  const playerRows = player.rows;
  const expectedRows = expected.rows;

  if (playerRows.length === 0 && expectedRows.length === 0) {
    return { ok: true };
  }

  if (playerRows.length > 0 && expectedRows.length > 0) {
    const playerColumnCount = Object.keys(playerRows[0]).length;
    const expectedColumnCount = Object.keys(expectedRows[0]).length;
    if (playerColumnCount !== expectedColumnCount) {
      return { ok: false, kind: 'columnCount' };
    }
  }

  const playerValues = playerRows.map(rowToValues);
  const expectedValues = expectedRows.map(rowToValues);

  if (options.preserveOrder) {
    const playerJson = JSON.stringify(playerValues);
    const expectedJson = JSON.stringify(expectedValues);
    if (playerJson === expectedJson) {
      return { ok: true };
    }
    if (playerValues.length > expectedValues.length) {
      return { ok: false, kind: 'tooManyRows' };
    }
    if (playerValues.length < expectedValues.length) {
      return { ok: false, kind: 'tooFewRows' };
    }
    return { ok: false, kind: 'wrongRows' };
  }

  const playerSorted = sortRows(playerValues);
  const expectedSorted = sortRows(expectedValues);

  if (JSON.stringify(playerSorted) === JSON.stringify(expectedSorted)) {
    return { ok: true };
  }

  if (playerValues.length > expectedValues.length) {
    return { ok: false, kind: 'tooManyRows' };
  }
  if (playerValues.length < expectedValues.length) {
    return { ok: false, kind: 'tooFewRows' };
  }
  return { ok: false, kind: 'wrongRows' };
}

export function describeIslandResultSetMismatch(
  kind: IslandResultSetMismatchKind,
): string {
  switch (kind) {
    case 'columnCount':
      return 'El número de columnas no coincide con el resultado esperado.';
    case 'tooManyRows':
      return 'Tu consulta devuelve demasiadas filas.';
    case 'tooFewRows':
      return 'Tu consulta devuelve muy pocas filas.';
    case 'wrongRows':
      return 'Las filas devueltas no coinciden con el resultado esperado.';
    default:
      return 'El resultado no coincide con lo esperado.';
  }
}
