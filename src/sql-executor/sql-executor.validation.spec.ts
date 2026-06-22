import { assertSandboxSqlAllowed } from './sql-executor.validation';

describe('sql-executor.validation', () => {
  it('permite SELECT, INSERT, UPDATE y DELETE sobre datos', () => {
    expect(() =>
      assertSandboxSqlAllowed('SELECT * FROM practica_alumnos'),
    ).not.toThrow();
    expect(() =>
      assertSandboxSqlAllowed(
        "INSERT INTO practica_alumnos (nombre, email) VALUES ('Ana', 'ana@test.com')",
      ),
    ).not.toThrow();
    expect(() =>
      assertSandboxSqlAllowed(
        'UPDATE practica_alumnos SET edad = 25 WHERE id = 1',
      ),
    ).not.toThrow();
    expect(() =>
      assertSandboxSqlAllowed('DELETE FROM practica_alumnos WHERE id = 99'),
    ).not.toThrow();
  });

  it('rechaza DROP DATABASE y CREATE DATABASE', () => {
    expect(() =>
      assertSandboxSqlAllowed('DROP DATABASE tesis_sandbox'),
    ).toThrow(/DROP DATABASE/i);
    expect(() => assertSandboxSqlAllowed('CREATE DATABASE otra_base')).toThrow(
      /CREATE DATABASE/i,
    );
  });

  it('rechaza DDL sobre tablas', () => {
    expect(() =>
      assertSandboxSqlAllowed('DROP TABLE practica_alumnos'),
    ).toThrow(/tablas/i);
    expect(() =>
      assertSandboxSqlAllowed('CREATE TABLE hack (id INT PRIMARY KEY)'),
    ).toThrow(/tablas/i);
    expect(() =>
      assertSandboxSqlAllowed(
        'ALTER TABLE practica_alumnos ADD COLUMN extra VARCHAR(10)',
      ),
    ).toThrow(/tablas/i);
    expect(() =>
      assertSandboxSqlAllowed('TRUNCATE TABLE practica_alumnos'),
    ).toThrow(/tablas/i);
  });
});
