import { randomBytes } from 'node:crypto';

export const ISLAND_SESSION_ID_PATTERN = /^[a-f0-9]{32}$/i;
export const ISLAND_SESSION_DB_PREFIX = 'tesis_island_';

const ISLAND_TABLES = ['pueblo', 'habitante', 'objeto'] as const;

export function createIslandSessionId(): string {
  return randomBytes(16).toString('hex');
}

export function assertValidIslandSessionId(sessionId: string): void {
  if (!ISLAND_SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error('Identificador de sesión no válido.');
  }
}

export function getIslandSessionDatabaseName(sessionId: string): string {
  assertValidIslandSessionId(sessionId);
  return `${ISLAND_SESSION_DB_PREFIX}${sessionId}`;
}

export function getIslandTemplateTables(): readonly string[] {
  return ISLAND_TABLES;
}

export function quoteMysqlIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, '``')}\``;
}
