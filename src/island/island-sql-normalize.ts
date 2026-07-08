export type IslandSqlCompareResult =
  | { ok: true; executable: string }
  | { ok: false; message: string; mismatch: boolean; hint?: string };

const SQL_TOKEN_PATTERN =
  /('(?:''|[^'])*')|("(?:""|[^"])*")|(\d+(?:\.\d+)?)|([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)|(!=|<>|<=|>=|=|<|>|\*|\(|\)|,|;)/g;

/** Convierte literales con comillas dobles a simples para MySQL (p. ej. "Extranjero" → 'Extranjero'). */
export function normalizeIslandDoubleQuotedStrings(sql: string): string {
  let result = '';
  let index = 0;

  while (index < sql.length) {
    const char = sql[index];

    if (char === "'") {
      const literal = readIslandQuotedLiteral(sql, index, "'");
      result += literal.value;
      index = literal.end;
      continue;
    }

    if (char === '"') {
      const literal = readIslandQuotedLiteral(sql, index, '"');
      result += `'${literal.inner.replace(/'/g, "''")}'`;
      index = literal.end;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

function readIslandQuotedLiteral(
  sql: string,
  start: number,
  quote: "'" | '"',
): { value: string; inner: string; end: number } {
  let index = start + 1;
  let inner = '';

  while (index < sql.length) {
    if (sql[index] === quote) {
      if (sql[index + 1] === quote) {
        inner += quote;
        index += 2;
        continue;
      }
      index += 1;
      break;
    }
    inner += sql[index];
    index += 1;
  }

  return {
    value: sql.slice(start, index),
    inner,
    end: index,
  };
}

function copyIslandQuotedLiteral(
  sql: string,
  start: number,
): { value: string; end: number } {
  const quote = sql[start] as "'" | '"';
  const literal = readIslandQuotedLiteral(sql, start, quote);
  if (quote === '"') {
    return {
      value: `'${literal.inner.replace(/'/g, "''")}'`,
      end: literal.end,
    };
  }
  return { value: literal.value, end: literal.end };
}

export function stripIslandSqlComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

function isWordToken(token: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) || /^\d/.test(token);
}

function requiresSpaceBetween(prev: string, next: string): boolean {
  if (prev === '*' && isWordToken(next)) {
    return true;
  }
  if (isWordToken(prev) && next === '*') {
    return true;
  }
  if (isWordToken(prev) && isWordToken(next)) {
    return true;
  }
  if (prev === ')' && (isWordToken(next) || next === '(')) {
    return true;
  }
  return false;
}

export function assertIslandSqlTokenSpacing(sql: string): string | null {
  const tokens: Array<{ value: string; start: number; end: number }> = [];
  SQL_TOKEN_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SQL_TOKEN_PATTERN.exec(sql)) !== null) {
    tokens.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  let pos = 0;
  for (const token of tokens) {
    const between = sql.slice(pos, token.start);
    if (/[^\s]/.test(between)) {
      return 'Separa cada palabra clave, columna y valor con espacios (por ejemplo: SELECT * FROM tabla;).';
    }
    pos = token.end;
  }

  if (/[^\s]/.test(sql.slice(pos))) {
    return 'Separa cada palabra clave, columna y valor con espacios (por ejemplo: SELECT * FROM tabla;).';
  }

  for (let index = 1; index < tokens.length; index += 1) {
    const previous = tokens[index - 1];
    const current = tokens[index];
    const between = sql.slice(previous.end, current.start);
    if (
      !/\s/.test(between) &&
      requiresSpaceBetween(previous.value, current.value)
    ) {
      return 'Separa cada palabra clave, columna y valor con espacios (por ejemplo: SELECT * FROM tabla;).';
    }
  }

  return null;
}

function lowercaseOutsideStrings(sql: string): string {
  let result = '';
  let index = 0;

  while (index < sql.length) {
    if (sql[index] === "'" || sql[index] === '"') {
      const literal = copyIslandQuotedLiteral(sql, index);
      result += literal.value;
      index = literal.end;
      continue;
    }

    result += sql[index].toLowerCase();
    index += 1;
  }

  return result;
}

function prepareIslandPlayerSql(sql: string): string {
  return normalizeIslandDoubleQuotedStrings(stripIslandSqlComments(sql.trim()));
}

/** Una sentencia por envío; el `;` final es opcional (como SQL Island original). */
export function trimIslandSqlToSingleStatement(sql: string): string {
  const semipos = sql.indexOf(';');
  const single = semipos === -1 ? sql : sql.slice(0, semipos);
  const trimmed = single.trim();

  if (!trimmed) {
    throw new Error('La sentencia SQL no puede estar vacía.');
  }

  if (semipos !== -1 && sql.slice(semipos + 1).trim()) {
    throw new Error('Solo se permite ejecutar una sentencia SQL a la vez.');
  }

  return trimmed;
}

export function normalizeIslandSqlForComparison(sql: string): string {
  const stripped = stripIslandSqlComments(sql);
  const collapsed = stripped.replace(/\s+/g, ' ').trim();
  const withSemicolon = collapsed.endsWith(';') ? collapsed : `${collapsed};`;
  return lowercaseOutsideStrings(withSemicolon.replace(/;+\s*$/g, ';'));
}

function stripSemicolonForAnalysis(sql: string): string {
  return normalizeIslandSqlForComparison(sql).replace(/;$/, '');
}

function formatExpectedSolution(solutionSql: string): string {
  const trimmed = stripIslandSqlComments(solutionSql.trim());
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`;
}

export function formatIslandExpectedHint(solutionSql: string): string {
  return `Consulta esperada:\n${formatExpectedSolution(solutionSql)}`;
}

const ISLAND_SQL_KEYWORDS = new Set([
  'select',
  'from',
  'where',
  'and',
  'or',
  'not',
  'like',
  'is',
  'null',
  'insert',
  'into',
  'values',
  'update',
  'set',
  'delete',
  'order',
  'by',
  'group',
  'asc',
  'desc',
  'inner',
  'join',
  'on',
  'as',
  'count',
  'sum',
  'avg',
  'max',
  'min',
  'distinct',
  'between',
  'in',
  'limit',
  'having',
]);

function maskSolutionIdentifiers(sql: string): string {
  return sql.replace(
    /\b[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*\b|\*/g,
    (token) => {
      if (token === '*') {
        return '___';
      }
      const parts = token.split('.');
      if (parts.every((part) => ISLAND_SQL_KEYWORDS.has(part.toLowerCase()))) {
        return token;
      }
      if (parts.length === 1 && ISLAND_SQL_KEYWORDS.has(token.toLowerCase())) {
        return token;
      }
      return '___';
    },
  );
}

/** Plantilla abstracta para el placeholder del editor (sin nombres reales de tablas/columnas). */
export function solutionToSqlTemplate(solutionSql: string): string {
  let sql = stripIslandSqlComments(solutionSql).replace(/\s+/g, ' ').trim();

  sql = normalizeIslandDoubleQuotedStrings(sql);
  sql = sql.replace(/'(?:''|[^'])*'/g, "'___'");
  sql = sql.replace(/\b\d+\b/g, '___');
  sql = maskSolutionIdentifiers(sql);
  sql = sql.replace(/\s+/g, ' ').trim();

  return sql.endsWith(';') ? sql : `${sql};`;
}

type SqlStatementKind = 'select' | 'insert' | 'update' | 'delete' | 'other';

function getStatementKind(stripped: string): SqlStatementKind {
  if (stripped.startsWith('select ')) {
    return 'select';
  }
  if (stripped.startsWith('insert ')) {
    return 'insert';
  }
  if (stripped.startsWith('update ')) {
    return 'update';
  }
  if (stripped.startsWith('delete ')) {
    return 'delete';
  }
  return 'other';
}

function usesSelectStar(stripped: string): boolean {
  return /^select\s+\*\s+from\b/.test(stripped);
}

function extractFromClause(stripped: string): string | null {
  const match = stripped.match(
    /\bfrom\s+(.+?)(?:\s+where\b|\s+group\s+by\b|\s+order\s+by\b|\s+having\b|\s+limit\b|$)/,
  );
  return match ? match[1].trim() : null;
}

function extractWhereClause(stripped: string): string | null {
  const match = stripped.match(
    /\bwhere\s+(.+?)(?:\s+group\s+by\b|\s+order\s+by\b|\s+having\b|\s+limit\b|$)/,
  );
  return match ? match[1].trim() : null;
}

function extractOrderByClause(stripped: string): string | null {
  const match = stripped.match(/\border\s+by\s+(.+?)(?:\s+limit\b|$)/);
  return match ? match[1].trim() : null;
}

function extractGroupByClause(stripped: string): string | null {
  const match = stripped.match(
    /\bgroup\s+by\s+(.+?)(?:\s+having\b|\s+order\s+by\b|\s+limit\b|$)/,
  );
  return match ? match[1].trim() : null;
}

function extractSelectList(stripped: string): string | null {
  const match = stripped.match(/^select\s+(.+?)\s+from\s+/);
  return match ? match[1].trim() : null;
}

function extractUpdateTable(stripped: string): string | null {
  const match = stripped.match(/^update\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+set\b/);
  return match ? match[1].trim() : null;
}

function extractUpdateSet(stripped: string): string | null {
  const match = stripped.match(
    /^update\s+[a-zA-Z_][a-zA-Z0-9_.]*\s+set\s+(.+?)(?:\s+where\b|$)/,
  );
  return match ? match[1].trim() : null;
}

function extractDeleteTable(stripped: string): string | null {
  const match = stripped.match(/^delete\s+from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\b/);
  return match ? match[1].trim() : null;
}

function compareWhereClauses(
  player: string,
  solution: string,
  hint: string,
): { message: string; hint: string } | null {
  const solutionWhere = extractWhereClause(solution);
  const playerWhere = extractWhereClause(player);
  if (solutionWhere === playerWhere) {
    return null;
  }
  if (solutionWhere && !playerWhere) {
    return {
      message: 'Falta la condición WHERE de este paso.',
      hint,
    };
  }
  if (!solutionWhere && playerWhere) {
    return {
      message: 'Este paso no lleva WHERE; quita el filtro.',
      hint,
    };
  }
  return {
    message: 'La condición WHERE no coincide con la esperada.',
    hint,
  };
}

export function describeIslandSqlMismatch(
  playerSql: string,
  solutionSql: string,
): { message: string; hint: string } {
  const player = stripSemicolonForAnalysis(playerSql);
  const solution = stripSemicolonForAnalysis(solutionSql);
  const expected = formatExpectedSolution(solutionSql);
  const hint = `Consulta esperada:\n${expected}`;

  const playerKind = getStatementKind(player);
  const solutionKind = getStatementKind(solution);

  if (playerKind !== solutionKind) {
    const labels: Record<SqlStatementKind, string> = {
      select: 'SELECT',
      insert: 'INSERT',
      update: 'UPDATE',
      delete: 'DELETE',
      other: 'SQL',
    };
    return {
      message: `Este paso requiere ${labels[solutionKind]}, no ${labels[playerKind]}.`,
      hint,
    };
  }

  if (solutionKind === 'select') {
    const solutionStar = usesSelectStar(solution);
    const playerStar = usesSelectStar(player);

    if (solutionStar && !playerStar) {
      return {
        message:
          'Listaste columnas concretas, pero este paso pide SELECT * (todas las columnas de la tabla).',
        hint,
      };
    }

    if (!solutionStar && playerStar) {
      return {
        message:
          'Usaste SELECT *, pero este paso pide columnas o expresiones específicas en el SELECT.',
        hint,
      };
    }

    if (!solutionStar && !playerStar) {
      const solutionSelectList = extractSelectList(solution);
      const playerSelectList = extractSelectList(player);
      if (
        solutionSelectList &&
        playerSelectList &&
        solutionSelectList !== playerSelectList
      ) {
        return {
          message:
            'Las columnas o expresiones del SELECT no coinciden con las esperadas.',
          hint,
        };
      }
    }

    const solutionFrom = extractFromClause(solution);
    const playerFrom = extractFromClause(player);
    if (solutionFrom && playerFrom && solutionFrom !== playerFrom) {
      return {
        message: 'Revisa la tabla o tablas del FROM.',
        hint,
      };
    }

    const solutionGroupBy = extractGroupByClause(solution);
    const playerGroupBy = extractGroupByClause(player);
    if (solutionGroupBy !== playerGroupBy) {
      return {
        message: 'Revisa el GROUP BY de tu consulta.',
        hint,
      };
    }

    const solutionOrderBy = extractOrderByClause(solution);
    const playerOrderBy = extractOrderByClause(player);
    if (solutionOrderBy !== playerOrderBy) {
      return {
        message: 'Revisa el ORDER BY de tu consulta.',
        hint,
      };
    }
  }

  if (solutionKind === 'update') {
    const solutionTable = extractUpdateTable(solution);
    const playerTable = extractUpdateTable(player);
    if (solutionTable && playerTable && solutionTable !== playerTable) {
      return {
        message: 'Revisa el nombre de la tabla en tu UPDATE.',
        hint,
      };
    }

    const solutionSet = extractUpdateSet(solution);
    const playerSet = extractUpdateSet(player);
    if (solutionSet && playerSet && solutionSet !== playerSet) {
      return {
        message: 'Revisa la cláusula SET de tu UPDATE.',
        hint,
      };
    }
  }

  if (solutionKind === 'delete') {
    const solutionTable = extractDeleteTable(solution);
    const playerTable = extractDeleteTable(player);
    if (solutionTable && playerTable && solutionTable !== playerTable) {
      return {
        message: 'Revisa el nombre de la tabla en tu DELETE.',
        hint,
      };
    }
  }

  if (
    solutionKind === 'select' ||
    solutionKind === 'update' ||
    solutionKind === 'delete'
  ) {
    const whereMismatch = compareWhereClauses(player, solution, hint);
    if (whereMismatch) {
      return whereMismatch;
    }
  }

  return {
    message: 'Tu sentencia no coincide con la forma esperada para este paso.',
    hint,
  };
}

export function compareIslandSql(
  playerSql: string,
  solutionSql: string,
): IslandSqlCompareResult {
  const stripped = prepareIslandPlayerSql(playerSql);
  if (!stripped) {
    return {
      ok: false,
      message: 'La sentencia SQL no puede estar vacía.',
      mismatch: false,
    };
  }

  let executable: string;
  try {
    executable = trimIslandSqlToSingleStatement(stripped);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Sentencia SQL no válida.',
      mismatch: false,
    };
  }

  const spacingError = assertIslandSqlTokenSpacing(stripped);
  if (spacingError) {
    return { ok: false, message: spacingError, mismatch: false };
  }

  const playerNormalized = normalizeIslandSqlForComparison(stripped);
  const solutionNormalized = normalizeIslandSqlForComparison(solutionSql);

  if (playerNormalized !== solutionNormalized) {
    const diagnosis = describeIslandSqlMismatch(stripped, solutionSql);
    return {
      ok: false,
      message: diagnosis.message,
      mismatch: true,
      hint: diagnosis.hint,
    };
  }

  return {
    ok: true,
    executable,
  };
}

/** Valida formato del jugador y devuelve SQL ejecutable (sin `;` final). */
export function parseIslandPlayerSql(playerSql: string): string {
  const stripped = prepareIslandPlayerSql(playerSql);
  const executable = trimIslandSqlToSingleStatement(stripped);

  const spacingError = assertIslandSqlTokenSpacing(stripped);
  if (spacingError) {
    throw new Error(spacingError);
  }

  return executable;
}
