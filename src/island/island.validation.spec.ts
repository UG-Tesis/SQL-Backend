import { assertIslandSqlAllowed } from './island.validation';

describe('island.validation', () => {
  it('permite DELETE FROM habitante en varias líneas', () => {
    expect(() =>
      assertIslandSqlAllowed(`DELETE FROM habitante
WHERE nombre = 'Dorotea Sucia'`),
    ).not.toThrow();
  });

  it('permite DELETE FROM habitante en una línea', () => {
    expect(() =>
      assertIslandSqlAllowed(
        "DELETE FROM habitante WHERE nombre = 'Dieter Sucio'",
      ),
    ).not.toThrow();
  });

  it('permite INSERT INTO habitante', () => {
    expect(() =>
      assertIslandSqlAllowed(
        "INSERT INTO habitante (nombre, pueblo_id, genero, profesion, oro, estado) VALUES ('Extranjero', 1, '?', '?', 0, '?')",
      ),
    ).not.toThrow();
  });

  it('permite UPDATE habitante', () => {
    expect(() =>
      assertIslandSqlAllowed(
        "UPDATE habitante SET nombre = 'Pedro' WHERE habitante_id = 20",
      ),
    ).not.toThrow();
  });
});
