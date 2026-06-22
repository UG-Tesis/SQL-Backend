import {
  assertMisterioSqlAllowed,
  isSolutionInsert,
  isSolucionSelect,
  parseSolutionInsert,
} from './misterio.validation';

describe('misterio.validation', () => {
  it('permite SELECT', () => {
    expect(() =>
      assertMisterioSqlAllowed(
        "SELECT * FROM informe_escena_crimen WHERE ciudad = 'Ciudad SQL'",
      ),
    ).not.toThrow();
  });

  it('permite INSERT en solucion', () => {
    const sql = "INSERT INTO solucion VALUES (1, 'Jeremías Bowers')";
    expect(() => assertMisterioSqlAllowed(sql)).not.toThrow();
    expect(isSolutionInsert(sql)).toBe(true);
    expect(parseSolutionInsert(sql)).toEqual({
      usuario: 1,
      valor: 'Jeremías Bowers',
    });
  });

  it('rechaza SELECT en solucion', () => {
    expect(() =>
      assertMisterioSqlAllowed('SELECT valor FROM solucion'),
    ).toThrow(/SELECT sobre la tabla solucion/i);
    expect(isSolucionSelect('SELECT * FROM solucion')).toBe(true);
  });

  it('rechaza INSERT en otras tablas', () => {
    expect(() =>
      assertMisterioSqlAllowed("INSERT INTO persona VALUES (1, 'Test')"),
    ).toThrow(/solucion/i);
  });

  it('rechaza UPDATE y DELETE', () => {
    expect(() =>
      assertMisterioSqlAllowed('DELETE FROM persona WHERE id = 1'),
    ).toThrow();
    expect(() =>
      assertMisterioSqlAllowed("UPDATE persona SET nombre = 'x' WHERE id = 1"),
    ).toThrow();
  });
});
