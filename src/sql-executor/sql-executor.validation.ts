export const SANDBOX_DATABASE_ENV = 'MYSQL_SANDBOX_DATABASE';
export const DEFAULT_SANDBOX_DATABASE = 'tesis_sandbox';

export interface SqlValidationRule {
  pattern: RegExp;
  message: string;
}

/** Operaciones prohibidas sobre bases de datos (entorno de práctica). */
export const DATABASE_FORBIDDEN_RULES: SqlValidationRule[] = [
  {
    pattern: /\bCREATE\s+DATABASE\b/i,
    message: 'CREATE DATABASE no está permitido en el sandbox.',
  },
  {
    pattern: /\bCREATE\s+SCHEMA\b/i,
    message: 'CREATE SCHEMA no está permitido en el sandbox.',
  },
  {
    pattern: /\bDROP\s+DATABASE\b/i,
    message: 'DROP DATABASE no está permitido en el sandbox.',
  },
  {
    pattern: /\bDROP\s+SCHEMA\b/i,
    message: 'DROP SCHEMA no está permitido en el sandbox.',
  },
  {
    pattern: /\bALTER\s+DATABASE\b/i,
    message: 'ALTER DATABASE no está permitido en el sandbox.',
  },
  {
    pattern: /\bALTER\s+SCHEMA\b/i,
    message: 'ALTER SCHEMA no está permitido en el sandbox.',
  },
  {
    pattern: /\bRENAME\s+DATABASE\b/i,
    message: 'RENAME DATABASE no está permitido en el sandbox.',
  },
];

/** Otras operaciones peligrosas en el entorno de estudiantes. */
export const SANDBOX_FORBIDDEN_RULES: SqlValidationRule[] = [
  {
    pattern: /\bUSE\s+\S/i,
    message:
      'USE no está permitido. Las consultas se ejecutan solo en tesis_sandbox.',
  },
  {
    pattern: /\bINTO\s+OUTFILE\b/i,
    message: 'INTO OUTFILE no está permitido en el sandbox.',
  },
  {
    pattern: /\bLOAD\s+DATA\b/i,
    message: 'LOAD DATA no está permitido en el sandbox.',
  },
  {
    pattern: /\bLOAD\s+FILE\b/i,
    message: 'LOAD FILE no está permitido en el sandbox.',
  },
  {
    pattern: /\bSHUTDOWN\b/i,
    message: 'SHUTDOWN no está permitido en el sandbox.',
  },
];

export function stripSqlLiterals(sql: string): string {
  return sql
    .replace(/'([^'\\]|\\.)*'/g, "''")
    .replace(/"([^"\\]|\\.)*"/g, '""')
    .replace(/`([^`\\]|\\.)*`/g, '``');
}

export function assertSandboxSqlAllowed(sql: string): void {
  const checkTarget = stripSqlLiterals(sql);
  const rules = [...DATABASE_FORBIDDEN_RULES, ...SANDBOX_FORBIDDEN_RULES];

  for (const rule of rules) {
    if (rule.pattern.test(checkTarget)) {
      throw new Error(rule.message);
    }
  }
}
