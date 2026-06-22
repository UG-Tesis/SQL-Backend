import {
  DATABASE_FORBIDDEN_RULES,
  stripSqlLiterals,
} from '../sql-executor/sql-executor.validation';

export const MISTERIO_DATABASE_ENV = 'MYSQL_MISTERIO_DATABASE';
export const DEFAULT_MISTERIO_DATABASE = 'tesis_misterio';

const FORBIDDEN_OPERATIONS: Array<{ pattern: RegExp; message: string }> = [
  ...DATABASE_FORBIDDEN_RULES,
  {
    pattern: /\bUSE\s+\S/i,
    message:
      'USE no está permitido. Las consultas se ejecutan solo en tesis_misterio.',
  },
  {
    pattern: /\bINTO\s+OUTFILE\b/i,
    message: 'INTO OUTFILE no está permitido en el juego.',
  },
  {
    pattern: /\bLOAD\s+DATA\b/i,
    message: 'LOAD DATA no está permitido en el juego.',
  },
  {
    pattern: /\bLOAD\s+FILE\b/i,
    message: 'LOAD FILE no está permitido en el juego.',
  },
  {
    pattern: /\bSHUTDOWN\b/i,
    message: 'SHUTDOWN no está permitido en el juego.',
  },
  {
    pattern: /\b(?:UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|RENAME)\b/i,
    message:
      'Solo se permiten consultas SELECT sobre las tablas del caso e INSERT en la tabla solucion.',
  },
];

export interface ParsedSolutionInsert {
  usuario: number;
  valor: string;
}

export function assertMisterioSqlAllowed(sql: string): void {
  const checkTarget = stripSqlLiterals(sql);

  for (const rule of FORBIDDEN_OPERATIONS) {
    if (rule.pattern.test(checkTarget)) {
      throw new Error(rule.message);
    }
  }

  if (/^\s*SELECT\b/i.test(checkTarget) && isSolucionSelect(sql)) {
    throw new Error(
      'No se permite SELECT sobre la tabla solucion. Entrega tu respuesta con INSERT INTO solucion.',
    );
  }

  if (/^\s*INSERT\b/i.test(checkTarget) && !isSolutionInsert(sql)) {
    throw new Error(
      'INSERT solo está permitido en la tabla solucion para verificar tu respuesta.',
    );
  }

  if (
    !/^\s*SELECT\b/i.test(checkTarget) &&
    !/^\s*INSERT\b/i.test(checkTarget)
  ) {
    throw new Error(
      'Solo se permiten consultas SELECT sobre las tablas del caso e INSERT en la tabla solucion.',
    );
  }
}

export function isSolutionInsert(sql: string): boolean {
  const checkTarget = stripSqlLiterals(sql.trim());
  return /^\s*INSERT\s+INTO\s+`?solucion`?\b/i.test(checkTarget);
}

export function isSolucionSelect(sql: string): boolean {
  const checkTarget = stripSqlLiterals(sql.trim());
  return (
    /\bFROM\s+`?solucion`?\b/i.test(checkTarget) ||
    /\bJOIN\s+`?solucion`?\b/i.test(checkTarget)
  );
}

export function parseSolutionInsert(sql: string): ParsedSolutionInsert | null {
  const trimmed = sql.trim().replace(/;+\s*$/g, '');

  const singleQuoted = trimmed.match(
    /^\s*INSERT\s+INTO\s+`?solucion`?(?:\s*\([^)]*\))?\s*VALUES\s*\(\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)\s*$/i,
  );
  if (singleQuoted) {
    return {
      usuario: Number(singleQuoted[1]),
      valor: singleQuoted[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
    };
  }

  const doubleQuoted = trimmed.match(
    /^\s*INSERT\s+INTO\s+`?solucion`?(?:\s*\([^)]*\))?\s*VALUES\s*\(\s*(\d+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)\s*$/i,
  );
  if (doubleQuoted) {
    return {
      usuario: Number(doubleQuoted[1]),
      valor: doubleQuoted[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
    };
  }

  return null;
}
