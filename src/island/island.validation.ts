import {
  DATABASE_FORBIDDEN_RULES,
  stripSqlLiterals,
} from '../sql-executor/sql-executor.validation';

const ISLAND_TABLES = ['pueblo', 'habitante', 'objeto'] as const;

const FORBIDDEN_OPERATIONS: Array<{ pattern: RegExp; message: string }> = [
  ...DATABASE_FORBIDDEN_RULES,
  {
    pattern: /\bUSE\s+\S/i,
    message:
      'USE no está permitido. Las consultas se ejecutan solo en tesis_island.',
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
    pattern: /\b(?:DROP|CREATE|ALTER|TRUNCATE|RENAME)\b/i,
    message:
      'Solo se permiten SELECT, INSERT, UPDATE y DELETE sobre las tablas del juego.',
  },
];

export function assertIslandSqlAllowed(sql: string): void {
  const checkTarget = stripSqlLiterals(sql);

  for (const rule of FORBIDDEN_OPERATIONS) {
    if (rule.pattern.test(checkTarget)) {
      throw new Error(rule.message);
    }
  }

  if (
    !/^\s*SELECT\b/i.test(checkTarget) &&
    !/^\s*INSERT\b/i.test(checkTarget) &&
    !/^\s*UPDATE\b/i.test(checkTarget) &&
    !/^\s*DELETE\b/i.test(checkTarget)
  ) {
    throw new Error(
      'Solo se permiten consultas SELECT, INSERT, UPDATE y DELETE sobre las tablas del juego.',
    );
  }

  if (/^\s*INSERT\b/i.test(checkTarget)) {
    assertTouchesAllowedTable(checkTarget, 'INSERT');
  }
  if (/^\s*UPDATE\b/i.test(checkTarget)) {
    assertTouchesAllowedTable(checkTarget, 'UPDATE');
  }
  if (/^\s*DELETE\b/i.test(checkTarget)) {
    assertTouchesAllowedTable(checkTarget, 'DELETE');
  }
}

function assertTouchesAllowedTable(sql: string, operation: string): void {
  const tables = ISLAND_TABLES.join('|');
  let tablePattern: RegExp;

  if (operation === 'INSERT') {
    tablePattern = new RegExp(`\\bINSERT\\s+INTO\\s+\`?(${tables})\`?`, 'i');
  } else if (operation === 'UPDATE') {
    tablePattern = new RegExp(`\\bUPDATE\\s+\`?(${tables})\`?`, 'i');
  } else if (operation === 'DELETE') {
    tablePattern = new RegExp(`\\bDELETE\\s+FROM\\s+\`?(${tables})\`?`, 'i');
  } else {
    tablePattern = new RegExp(
      `\\b${operation}\\s+(?:FROM\\s+)?(?:INTO\\s+)?\`?(${tables})\`?`,
      'i',
    );
  }

  if (!tablePattern.test(sql)) {
    throw new Error(
      `${operation} solo está permitido sobre las tablas pueblo, habitante u objeto.`,
    );
  }

  if (/\bpueblo\b/i.test(sql) && !/^\s*(?:SELECT|UPDATE)\b/i.test(sql)) {
    throw new Error(
      'La tabla pueblo solo admite consultas SELECT o UPDATE limitados.',
    );
  }
}

export function stripOrderByClause(sql: string): string {
  const upper = sql.toUpperCase();
  const orderPos = upper.lastIndexOf(' ORDER BY ');
  if (orderPos === -1) {
    return sql.trim();
  }
  return sql.slice(0, orderPos).trim();
}
