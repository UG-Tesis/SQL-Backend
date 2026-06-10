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

function extractInsertColumns(statement: string): string[] | null {
  const match = statement.match(/\bINSERT\s+INTO\s+`?[\w`]+`?\s*\(\s*([^)]+)\s*\)/i);
  if (!match) return null;
  return match[1]
    .split(',')
    .map((column) => unquoteIdentifier(column.trim()).toLowerCase());
}

function extractUpdateSetColumns(statement: string): string[] {
  const match = statement.match(/\bSET\b([\s\S]*?)\bWHERE\b/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((assignment) => {
      const column = assignment.trim().split('=')[0]?.trim();
      return column ? unquoteIdentifier(column).toLowerCase() : '';
    })
    .filter(Boolean);
}

function whereColumnPresent(statement: string, column: string): boolean {
  const escapedColumn = column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `\\bWHERE\\b[\\s\\S]*\\b\`?${escapedColumn}\`?\\s*=`,
    'i',
  ).test(statement);
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

  const requiredColumns = expectation?.requiredInsertColumns ?? [];
  if (requiredColumns.length > 0) {
    const insertColumns = extractInsertColumns(statement);
    if (!insertColumns) {
      return failure(
        'Debes indicar explícitamente las columnas en el INSERT.',
        [`Ejemplo: INSERT INTO ${table} (nombre, email, edad) VALUES (...);`],
      );
    }

    const missingColumns = requiredColumns.filter(
      (column) => !insertColumns.includes(column.toLowerCase()),
    );
    if (missingColumns.length > 0) {
      return failure(
        `La sentencia INSERT debe incluir las columnas: ${requiredColumns.join(', ')}.`,
        [`Faltan: ${missingColumns.join(', ')}.`],
      );
    }
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

  const requiredSetColumns = expectation?.requiredUpdateSetColumns ?? [];
  if (requiredSetColumns.length > 0) {
    const setColumns = extractUpdateSetColumns(statement);
    const missingSetColumns = requiredSetColumns.filter(
      (column) => !setColumns.includes(column.toLowerCase()),
    );
    if (missingSetColumns.length > 0) {
      return failure(
        `La sentencia UPDATE debe modificar la columna: ${requiredSetColumns.join(', ')}.`,
        [`Falta actualizar: ${missingSetColumns.join(', ')} en la cláusula SET.`],
      );
    }
  }

  const updateSet = expectation?.updateSet ?? {};
  for (const [column, expected] of Object.entries(updateSet)) {
    if (typeof expected === 'number' && !numericAssignmentPresent(statement, column, expected)) {
      return failure(`Debes actualizar \`${column}\` al valor ${expected}.`);
    }
  }

  const requiredWhereColumns = expectation?.requiredWhereColumns ?? [];
  for (const column of requiredWhereColumns) {
    if (!whereColumnPresent(statement, column)) {
      return failure(`La cláusula WHERE debe filtrar por la columna \`${column}\`.`);
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

  const requiredWhereColumns = expectation?.requiredWhereColumns ?? [];
  for (const column of requiredWhereColumns) {
    if (!whereColumnPresent(statement, column)) {
      return failure(`La cláusula WHERE debe filtrar por la columna \`${column}\`.`);
    }
  }

  const deleteWhere = expectation?.deleteWhere ?? {};
  for (const [column, expected] of Object.entries(deleteWhere)) {
    if (!whereConditionPresent(statement, column, expected)) {
      return failure(`La cláusula WHERE debe filtrar por \`${column}\` = ${expected}.`);
    }
  }

  return success(`Correcto: sentencia DELETE válida para la tabla \`${table}\`.`);
}

function extractSelectClause(statement: string): string | null {
  const match = statement.match(/^SELECT\s+([\s\S]+?)\s+FROM\b/i);
  return match ? match[1].trim() : null;
}

function columnPresentInSelect(selectClause: string, column: string): boolean {
  const escaped = column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b\`?${escaped}\`?\\b`, 'i').test(selectClause);
}

function whereOperatorPresent(statement: string, operator: string): boolean {
  switch (operator) {
    case '<':
      return /\b\w+\s*<\s*[\d'"]/.test(statement);
    case '>':
      return /\b\w+\s*>\s*[\d'"]/.test(statement);
    case '!=':
      return /(?:!=|<>)/.test(statement);
    case 'AND':
      return /\bAND\b/i.test(statement);
    case 'OR':
      return /\bOR\b/i.test(statement);
    case 'NOT':
      return /\bNOT\b/i.test(statement);
    case 'BETWEEN':
      return /\bBETWEEN\b/i.test(statement);
    case 'IN':
      return /\bIN\s*\(/i.test(statement);
    case 'LIKE':
      return /\bLIKE\b/i.test(statement);
    default:
      return false;
  }
}

function validateSelectQuery(sql: string, expectation?: TaskExpectation): SqlValidationResult {
  const single = assertSingleStatement(sql);
  if (single) return single;

  const statement = normalizeSqlStatement(sql);
  const table = expectation?.selectTable ?? expectation?.tableName ?? SANDBOX_PRACTICE_TABLE;

  if (!/^SELECT\b/i.test(statement)) {
    return failure('La sentencia debe comenzar con SELECT.');
  }

  const fromPattern = new RegExp(`\\bFROM\\s+\`?${table}\`?\\b`, 'i');
  if (!fromPattern.test(statement)) {
    return failure(
      `Debes consultar la tabla \`${table}\` con FROM.`,
      ['Revisa la orden de la actividad.'],
    );
  }

  const selectClause = extractSelectClause(statement);
  if (!selectClause) {
    return failure('La consulta SELECT debe incluir la cláusula FROM.');
  }

  const columns = expectation?.selectColumns;
  if (columns === 'all') {
    if (!/^\*$/i.test(selectClause.trim())) {
      return failure(
        'Debes usar SELECT * para consultar todas las columnas.',
        [`Ejemplo de estructura: SELECT * FROM ${table};`],
      );
    }
  } else if (columns?.length) {
    const missing = columns.filter((column) => !columnPresentInSelect(selectClause, column));
    if (missing.length > 0) {
      return failure(
        `La consulta debe incluir las columnas: ${columns.map((c) => `\`${c}\``).join(', ')}.`,
        [`Faltan: ${missing.map((c) => `\`${c}\``).join(', ')}.`],
      );
    }
  }

  if (expectation?.requiresJoin) {
    if (!/\bJOIN\b/i.test(statement)) {
      return failure('La consulta debe incluir JOIN para unir dos tablas.');
    }

    if (expectation.joinTable) {
      const joinTablePattern = new RegExp(
        `\\bJOIN\\s+\`?${expectation.joinTable}\`?\\b`,
        'i',
      );
      if (!joinTablePattern.test(statement)) {
        return failure(`Debes hacer JOIN con la tabla \`${expectation.joinTable}\`.`);
      }
    }

    if (!/\bON\b/i.test(statement)) {
      return failure('El JOIN debe incluir la condición ON que enlaza las tablas.');
    }
  }

  const selectWhere = expectation?.selectWhere ?? {};
  const whereOperators = expectation?.requiresWhereOperators ?? [];
  const requiresWhere =
    Object.keys(selectWhere).length > 0 || whereOperators.length > 0;

  if (requiresWhere && !/\bWHERE\b/i.test(statement)) {
    return failure('La consulta debe incluir una cláusula WHERE.');
  }

  for (const [column, expected] of Object.entries(selectWhere)) {
    if (!whereConditionPresent(statement, column, expected)) {
      return failure(`La cláusula WHERE debe filtrar por \`${column}\` = ${expected}.`);
    }
  }

  for (const operator of whereOperators) {
    if (!whereOperatorPresent(statement, operator)) {
      return failure(`La consulta debe usar el operador ${operator} en la cláusula WHERE.`);
    }
  }

  if (expectation?.requiresOrderBy && !/\bORDER\s+BY\b/i.test(statement)) {
    return failure('La consulta debe incluir una cláusula ORDER BY.');
  }

  if (expectation?.orderByColumn) {
    const escaped = expectation.orderByColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\bORDER\\s+BY\\b[\\s\\S]*\\b\`?${escaped}\`?\\b`, 'i').test(statement)) {
      return failure(
        `La cláusula ORDER BY debe ordenar por la columna \`${expectation.orderByColumn}\`.`,
      );
    }
  }

  if (expectation?.requiresGroupBy && !/\bGROUP\s+BY\b/i.test(statement)) {
    return failure('La consulta debe incluir una cláusula GROUP BY.');
  }

  if (expectation?.groupByColumn) {
    const escaped = expectation.groupByColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\bGROUP\\s+BY\\b[\\s\\S]*\\b\`?${escaped}\`?\\b`, 'i').test(statement)) {
      return failure(
        `La cláusula GROUP BY debe agrupar por la columna \`${expectation.groupByColumn}\`.`,
      );
    }
  }

  const aggregates = expectation?.requiresAggregates ?? [];
  const aggregateColumn = expectation?.aggregateColumn;
  for (const aggregate of aggregates) {
    if (aggregateColumn) {
      const escapedColumn = aggregateColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (
        !new RegExp(
          `\\b${aggregate}\\s*\\(\\s*\`?${escapedColumn}\`?\\s*\\)`,
          'i',
        ).test(statement)
      ) {
        return failure(
          `La consulta debe usar ${aggregate}(\`${aggregateColumn}\`).`,
        );
      }
      continue;
    }

    if (!new RegExp(`\\b${aggregate}\\s*\\(`, 'i').test(statement)) {
      return failure(`La consulta debe usar la función de agregación ${aggregate}().`);
    }
  }

  if (expectation?.requiresLimit && !/\bLIMIT\b/i.test(statement)) {
    return failure('La consulta debe incluir una cláusula LIMIT.');
  }

  if (expectation?.limitValue != null) {
    if (!new RegExp(`\\bLIMIT\\s+${expectation.limitValue}\\b`, 'i').test(statement)) {
      return failure(`La cláusula LIMIT debe ser ${expectation.limitValue}.`);
    }
  }

  return success(`Correcto: consulta SELECT válida sobre la tabla \`${table}\`.`);
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
    case 'select_query':
      return validateSelectQuery(sql, expectation);
    default:
      return failure('Tipo de validación no soportado.');
  }
}
