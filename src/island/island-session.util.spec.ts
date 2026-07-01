import {
  assertValidIslandSessionId,
  createIslandSessionId,
  getIslandSessionDatabaseName,
} from './island-session.util';

describe('island-session.util', () => {
  it('genera identificadores hex de 32 caracteres', () => {
    const sessionId = createIslandSessionId();
    expect(sessionId).toHaveLength(32);
    expect(() => assertValidIslandSessionId(sessionId)).not.toThrow();
  });

  it('rechaza identificadores inválidos', () => {
    expect(() => assertValidIslandSessionId('abc')).toThrow(
      'Identificador de sesión no válido.',
    );
    expect(() => assertValidIslandSessionId('DROP DATABASE;')).toThrow(
      'Identificador de sesión no válido.',
    );
  });

  it('construye el nombre de la base clonada', () => {
    const sessionId = 'a'.repeat(32);
    expect(getIslandSessionDatabaseName(sessionId)).toBe(
      `tesis_island_${sessionId}`,
    );
  });
});
