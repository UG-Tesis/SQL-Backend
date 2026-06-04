import {
  SANDBOX_PRACTICE_TABLE,
  type TaskExpectation,
  type SqlValidationResult,
  type SqlValidationType,
} from './sql-validation.types';

function stripComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

export function normalizeSqlStatement(sql: string): string {
  const withoutComments = stripComments(sql);
  return withoutComments.replace(/;+\s*$/g, '').replace(/\s+/g, ' ').trim();
}

function identifierPattern(): string {
  return '(?:`[^`]+`|"[^"]+"|[a-zA-Z_][\\w]*)';
}

function unquoteIdentifier(token: string): string {
  const trimmed = token.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function extractDatabaseName(
  statement: string,
  kind: 'create' | 'drop' | 'use',
): string | null {
  const patterns: Record<'create' | 'drop' | 'use', RegExp> = {
    create: new RegExp(
      `^CREATE\\s+DATABASE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(${identifierPattern()})`,
      'i',
    ),
    drop: new RegExp(
      `^DROP\\s+DATABASE(?:\\s+IF\\s+EXISTS)?\\s+(${identifierPattern()})`,
      'i',
    ),
    use: new RegExp(`^USE\\s+(${identifierPattern()})`, 'i'),
  };

  const match = statement.match(patterns[kind]);
  return match ? unquoteIdentifier(match[1]) : null;
}

function success(message: string): SqlValidationResult {
  return { correct: true, message };
}

function failure(message: string, hints?: string[]): SqlValidationResult {
  return { correct: false, message, hints };
}

function assertSingleStatement(sql: string): SqlValidationResult | null {
  if (!sql.trim()) {
    return failure('La sentencia SQL no puede estar vacía.');
  }
  const normalized = normalizeSqlStatement(sql);
  if (!normalized) {
    return failure('La sentencia SQL no puede estar vacía.');
  }
  if (stripComments(sql).replace(/;+\s*$/g, '').includes(';')) {
    return failure('Solo se permite validar una sentencia SQL a la vez.');
  }
  return null;
}

function assertExpectedDatabase(
  statement: string,
  kind: 'create' | 'drop' | 'use',
  expectedName: string,
  verbLabel: string,
): SqlValidationResult | null {
  const actualName = extractDatabaseName(statement, kind);
  if (!actualName) return null;

  if (actualName.toLowerCase() !== expectedName.toLowerCase()) {
    return failure(
      `Debes ${verbLabel} la base de datos \`${expectedName}\`, no \`${actualName}\`.`,
      [`Revisa la orden de la actividad e incluye el nombre \`${expectedName}\`.`],
    );
  }

  return null;
}

function validateCreateDatabase(
  sql: string,
  expectation?: TaskExpectation,
): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const pattern = new RegExp(
    `^CREATE\\s+DATABASE(\\s+IF\\s+NOT\\s+EXISTS)?\\s+${identifierPattern()}(` +
      `(\\s+CHARACTER\\s+SET\\s+${identifierPattern()})?` +
      `(\\s+COLLATE\\s+${identifierPattern()})?)?$`,
    'i',
  );

  if (!pattern.test(statement)) {
    const expectedDb = expectation?.databaseName ?? 'biblioteca';
    return failure(
      'La sentencia no coincide con CREATE DATABASE.',
      [
        `Debes crear la base de datos \`${expectedDb}\`.`,
        `Ejemplo de estructura: CREATE DATABASE IF NOT EXISTS ${expectedDb};`,
      ],
    );
  }

  if (expectation?.databaseName) {
    const nameMismatch = assertExpectedDatabase(
      statement,
      'create',
      expectation.databaseName,
      'crear',
    );
    if (nameMismatch) return nameMismatch;
  }

  return success(
    `Correcto: creaste la base de datos \`${expectation?.databaseName ?? 'solicitada'}\`.`,
  );
}

function validateDropDatabase(
  sql: string,
  expectation?: TaskExpectation,
): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const pattern = new RegExp(
    `^DROP\\s+DATABASE(\\s+IF\\s+EXISTS)?\\s+${identifierPattern()}$`,
    'i',
  );

  if (!pattern.test(statement)) {
    const expectedDb = expectation?.databaseName ?? 'biblioteca';
    return failure(
      'La sentencia no coincide con DROP DATABASE.',
      [
        `Debes eliminar la base de datos \`${expectedDb}\`.`,
        `Ejemplo de estructura: DROP DATABASE IF EXISTS ${expectedDb};`,
      ],
    );
  }

  if (expectation?.databaseName) {
    const nameMismatch = assertExpectedDatabase(
      statement,
      'drop',
      expectation.databaseName,
      'eliminar',
    );
    if (nameMismatch) return nameMismatch;
  }

  return success(
    `Correcto: eliminaste la base de datos \`${expectation?.databaseName ?? 'solicitada'}\`.`,
  );
}

function validateUseDatabase(
  sql: string,
  expectation?: TaskExpectation,
): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const pattern = new RegExp(`^USE\\s+${identifierPattern()}$`, 'i');

  if (!pattern.test(statement)) {
    const expectedDb = expectation?.databaseName ?? 'tesis_sandbox';
    return failure(
      'La sentencia no coincide con USE.',
      [
        `Debes seleccionar la base de datos \`${expectedDb}\`.`,
        `Ejemplo de estructura: USE ${expectedDb};`,
      ],
    );
  }

  if (expectation?.databaseName) {
    const nameMismatch = assertExpectedDatabase(
      statement,
      'use',
      expectation.databaseName,
      'seleccionar',
    );
    if (nameMismatch) return nameMismatch;
  }

  return success(
    `Correcto: seleccionaste la base de datos \`${expectation?.databaseName ?? 'solicitada'}\`.`,
  );
}

function validateAlterTable(
  sql: string,
  expectation?: TaskExpectation,
): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const table = SANDBOX_PRACTICE_TABLE;
  const alterPattern = new RegExp(`^ALTER\\s+TABLE\\s+\`?${table}\`?\\s+`, 'i');

  if (!alterPattern.test(statement)) {
    return failure(
      `Debes usar ALTER TABLE sobre la tabla \`${table}\`.`,
      ['Revisa la orden de la actividad.'],
    );
  }

  const columnName = expectation?.columnName ?? 'telefono';
  const columnType = expectation?.columnType ?? 'VARCHAR(20)';
  const escapedColumn = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const addColumnPattern = new RegExp(
    `\\bADD(?:\\s+COLUMN)?\\s+\`?${escapedColumn}\`?\\s+${columnType.replace(/\(\s*/g, '\\(\\s*').replace(/\s*\)/g, '\\s*\\)')}`,
    'i',
  );

  if (!addColumnPattern.test(statement)) {
    return failure(
      `Debes agregar la columna \`${columnName}\` de tipo ${columnType} a la tabla \`${table}\`.`,
      [
        `Ejemplo de estructura: ALTER TABLE ${table} ADD COLUMN ${columnName} ${columnType};`,
      ],
    );
  }

  return success(
    `Correcto: agregaste la columna \`${columnName}\` a la tabla \`${table}\`.`,
  );
}

function normalizeForCompare(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function stringLiteralPresent(statement: string, value: string): boolean {
  const literals = statement.match(/'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/g) ?? [];
  const target = normalizeForCompare(value);
  return literals.some((literal) => {
    const unquoted = literal.slice(1, -1);
    return normalizeForCompare(unquoted) === target;
  });
}

function numericAssignmentPresent(
  statement: string,
  column: string,
  value: number,
): boolean {
  const escapedColumn = column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b\`?${escapedColumn}\`?\\s*=\\s*${value}\\b`, 'i').test(statement);
}

function whereConditionPresent(
  statement: string,
  column: string,
  value: string | number,
): boolean {
  const escapedColumn = column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (typeof value === 'number') {
    return new RegExp(
      `\\bWHERE\\b[\\s\\S]*\\b\`?${escapedColumn}\`?\\s*=\\s*${value}\\b`,
      'i',
    ).test(statement);
  }
  const flexible = value.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `\\bWHERE\\b[\\s\\S]*\\b\`?${escapedColumn}\`?\\s*=\\s*['"]${flexible}['"]`,
    'i',
  ).test(statement);
}

function validateInsertRow(sql: string, expectation?: TaskExpectation): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const table = expectation?.tableName ?? SANDBOX_PRACTICE_TABLE;
  const insertPattern = new RegExp(`^INSERT\\s+INTO\\s+\`?${table}\`?\\b`, 'i');

  if (!insertPattern.test(statement)) {
    return failure(
      `Debes usar INSERT INTO sobre la tabla \`${table}\`.`,
      ['Revisa la orden de la actividad.'],
    );
  }

  if (!/\bVALUES\b/i.test(statement)) {
    return failure('La sentencia INSERT debe incluir la cláusula VALUES.');
  }

  if (/\bINSERT\s+INTO\s+\`?[\w`]+\`?\s*\(\s*[^)]*\bid\b[^)]*\)/i.test(statement)) {
    return failure(
      'No debes incluir la columna `id` en el INSERT; se genera automáticamente.',
      ['Inserta solo nombre, email y edad.'],
    );
  }

  const values = expectation?.insertValues ?? {};
  const missing: string[] = [];

  for (const [column, expected] of Object.entries(values)) {
    if (typeof expected === 'number') {
      if (!new RegExp(`\\b${expected}\\b`).test(statement)) {
        missing.push(`${column} = ${expected}`);
      }
      continue;
    }
    if (!stringLiteralPresent(statement, expected)) {
      missing.push(`${column} = '${expected}'`);
    }
  }

  if (missing.length > 0) {
    return failure(
      `La sentencia INSERT no incluye los valores requeridos: ${missing.join(', ')}.`,
      ['Verifica nombre, email y edad indicados en la orden.'],
    );
  }

  return success(`Correcto: sentencia INSERT válida para la tabla \`${table}\`.`);
}

function validateUpdateRow(sql: string, expectation?: TaskExpectation): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const table = expectation?.tableName ?? SANDBOX_PRACTICE_TABLE;
  const updatePattern = new RegExp(`^UPDATE\\s+\`?${table}\`?\\s+SET\\b`, 'i');

  if (!updatePattern.test(statement)) {
    return failure(
      `Debes usar UPDATE sobre la tabla \`${table}\`.`,
      ['Revisa la orden de la actividad.'],
    );
  }

  if (!/\bWHERE\b/i.test(statement)) {
    return failure('La sentencia UPDATE debe incluir una cláusula WHERE.');
  }

  const updateSet = expectation?.updateSet ?? {};
  for (const [column, expected] of Object.entries(updateSet)) {
    if (typeof expected === 'number' && !numericAssignmentPresent(statement, column, expected)) {
      return failure(`Debes actualizar \`${column}\` al valor ${expected}.`);
    }
  }

  const updateWhere = expectation?.updateWhere ?? {};
  for (const [column, expected] of Object.entries(updateWhere)) {
    if (!whereConditionPresent(statement, column, expected)) {
      return failure(`La cláusula WHERE debe filtrar por \`${column}\` = ${expected}.`);
    }
  }

  return success(`Correcto: sentencia UPDATE válida para la tabla \`${table}\`.`);
}

function validateDeleteRow(sql: string, expectation?: TaskExpectation): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const table = expectation?.tableName ?? SANDBOX_PRACTICE_TABLE;
  const deletePattern = new RegExp(`^DELETE\\s+FROM\\s+\`?${table}\`?\\b`, 'i');

  if (!deletePattern.test(statement)) {
    return failure(
      `Debes usar DELETE FROM sobre la tabla \`${table}\`.`,
      ['Revisa la orden de la actividad.'],
    );
  }

  if (!/\bWHERE\b/i.test(statement)) {
    return failure(
      'La sentencia DELETE debe incluir WHERE para eliminar un registro específico.',
    );
  }

  const deleteWhere = expectation?.deleteWhere ?? {};
  for (const [column, expected] of Object.entries(deleteWhere)) {
    if (!whereConditionPresent(statement, column, expected)) {
      return failure(`La cláusula WHERE debe filtrar por \`${column}\` = ${expected}.`);
    }
  }

  return success(`Correcto: sentencia DELETE válida para la tabla \`${table}\`.`);
}

export function validateSqlByType(
  sql: string,
  type: SqlValidationType,
  expectation?: TaskExpectation,
): SqlValidationResult {
  switch (type) {
    case 'create_database':
      return validateCreateDatabase(sql, expectation);
    case 'drop_database':
      return validateDropDatabase(sql, expectation);
    case 'use_database':
      return validateUseDatabase(sql, expectation);
    case 'alter_table':
      return validateAlterTable(sql, expectation);
    case 'insert_row':
      return validateInsertRow(sql, expectation);
    case 'update_row':
      return validateUpdateRow(sql, expectation);
    case 'delete_row':
      return validateDeleteRow(sql, expectation);
    default:
      return failure('Tipo de validación no soportado.');
  }
}
