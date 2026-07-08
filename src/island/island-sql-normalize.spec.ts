import {
  assertIslandSqlTokenSpacing,
  compareIslandSql,
  normalizeIslandDoubleQuotedStrings,
  normalizeIslandSqlForComparison,
  parseIslandPlayerSql,
  solutionToSqlTemplate,
} from './island-sql-normalize';

describe('island-sql-normalize', () => {
  const solution = "SELECT * FROM habitante WHERE profesion = 'Carnicero'";

  it('acepta variaciones de mayúsculas y espacios con punto y coma', () => {
    for (const sql of [
      'SELECT * FROM pueblo;',
      'select * from pueblo;',
      'Select  *  from  pueblo;',
    ]) {
      expect(compareIslandSql(sql, 'SELECT * FROM pueblo').ok).toBe(true);
    }
  });

  it('acepta consultas sin punto y coma', () => {
    const result = compareIslandSql('Select * from pueblo', solution);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mismatch).toBe(true);
    }

    expect(parseIslandPlayerSql('SELECT * FROM pueblo')).toBe(
      'SELECT * FROM pueblo',
    );
  });

  it('rechaza tokens pegados sin espacio', () => {
    for (const sql of ['SELECT*FROMpueblo;', 'select*from pueblo;']) {
      const result = compareIslandSql(sql, solution);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.mismatch).toBe(false);
      }
    }

    const gluedTable = compareIslandSql(
      "SELECT * FROMhabitante WHERE profesion = 'Carnicero';",
      solution,
    );
    expect(gluedTable.ok).toBe(false);
  });

  it('rechaza consultas distintas y describe el error con la solución', () => {
    const result = compareIslandSql(
      "SELECT nombre, profesion FROM habitante WHERE profesion = 'Carnicero';",
      solution,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mismatch).toBe(true);
      expect(result.message).toContain('SELECT *');
      expect(result.hint).toContain(
        "SELECT * FROM habitante WHERE profesion = 'Carnicero';",
      );
    }
  });

  it('detecta cuando falta SELECT * para estado amigable', () => {
    const result = compareIslandSql(
      "SELECT nombre, estado FROM habitante WHERE estado = 'amigable';",
      "SELECT * FROM habitante WHERE estado = 'amigable'",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('SELECT *');
      expect(result.hint).toContain(
        "SELECT * FROM habitante WHERE estado = 'amigable';",
      );
    }
  });

  it('respeta mayúsculas dentro de literales', () => {
    const player = "select * from habitante where profesion = 'carnicero';";
    const result = compareIslandSql(player, solution);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mismatch).toBe(true);
    }
  });

  it('normaliza espacios y añade punto y coma a la solución de referencia', () => {
    expect(normalizeIslandSqlForComparison('SELECT * FROM pueblo')).toBe(
      'select * from pueblo;',
    );
  });

  it('parseIslandPlayerSql devuelve SQL sin punto y coma', () => {
    expect(parseIslandPlayerSql('SELECT * FROM pueblo;')).toBe(
      'SELECT * FROM pueblo',
    );
  });

  it('normaliza comillas dobles a simples al parsear', () => {
    expect(
      parseIslandPlayerSql(
        'SELECT * FROM habitante WHERE profesion = "Carnicero";',
      ),
    ).toBe("SELECT * FROM habitante WHERE profesion = 'Carnicero'");

    expect(
      assertIslandSqlTokenSpacing(
        'SELECT * FROM habitante WHERE profesion = "Carnicero";',
      ),
    ).toBeNull();
  });

  it('normalizeIslandDoubleQuotedStrings convierte literales LIKE', () => {
    expect(
      normalizeIslandDoubleQuotedStrings(
        'SELECT * FROM habitante WHERE profesion LIKE "%herrero"',
      ),
    ).toBe("SELECT * FROM habitante WHERE profesion LIKE '%herrero'");
  });

  it('assertIslandSqlTokenSpacing permite COUNT(*)', () => {
    expect(
      assertIslandSqlTokenSpacing(
        'SELECT COUNT(*) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id;',
      ),
    ).toBeNull();
  });

  it('genera plantilla abstracta sin nombres reales de tablas o columnas', () => {
    expect(
      solutionToSqlTemplate(
        "SELECT * FROM habitante WHERE profesion = 'Carnicero'",
      ),
    ).toBe("SELECT ___ FROM ___ WHERE ___ = '___';");

    expect(
      solutionToSqlTemplate(
        "UPDATE habitante SET nombre = 'Pedro' WHERE habitante_id = 20",
      ),
    ).toBe("UPDATE ___ SET ___ = '___' WHERE ___ = ___;");
  });
});
