import { readFileSync } from 'fs';
import {
  MISTERIO_WRONG_ANSWER_MESSAGE,
  MisterioSolutionService,
  resolveMisterioSolutionsPath,
} from './misterio-solution.service';

describe('MisterioSolutionService', () => {
  const service = new MisterioSolutionService();

  beforeAll(() => {
    const filePath = resolveMisterioSolutionsPath();
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      respuestas?: Array<{
        nombre: string;
        Descripcion: string;
        etapa?: 1 | 2;
      }>;
    };
    service['solutions'] = parsed.respuestas ?? [];
  });

  it('acepta al asesino con o sin tilde', () => {
    const result = service.evaluate('Jeremias Bowers');
    expect(result.correct).toBe(true);
    expect(result.etapa).toBe(1);
    expect(result.mensaje).toContain('asesino');
  });

  it('acepta al asesino en inglés', () => {
    const result = service.evaluate('Jeremy Bowers');
    expect(result.correct).toBe(true);
    expect(result.etapa).toBe(1);
  });

  it('acepta a la mente criminal', () => {
    const result = service.evaluate('Miranda Prestigio');
    expect(result.correct).toBe(true);
    expect(result.etapa).toBe(2);
  });

  it('rechaza nombres incorrectos', () => {
    const result = service.evaluate('Otra Persona');
    expect(result.correct).toBe(false);
    expect(result.etapa).toBeNull();
    expect(result.mensaje).toBe(MISTERIO_WRONG_ANSWER_MESSAGE);
  });
});
