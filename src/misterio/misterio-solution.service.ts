import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const MISTERIO_WRONG_ANSWER_MESSAGE =
  'Persona incorrecta. Inténtalo nuevamente.';

export const MISTERIO_SOLUTIONS_FILE = 'misterio-soluciones.json';

export interface MisterioSolutionCheck {
  correct: boolean;
  etapa: 1 | 2 | null;
  mensaje: string;
}

interface SolutionEntry {
  nombre: string;
  Descripcion: string;
  etapa?: 1 | 2;
}

interface SolutionsFile {
  respuestas?: SolutionEntry[];
}

export function resolveMisterioSolutionsPath(): string {
  const candidates = [
    join(__dirname, 'data', MISTERIO_SOLUTIONS_FILE),
    join(process.cwd(), 'src', 'misterio', 'data', MISTERIO_SOLUTIONS_FILE),
    join(process.cwd(), 'dist', 'src', 'misterio', 'data', MISTERIO_SOLUTIONS_FILE),
    join(process.cwd(), 'dist', 'misterio', 'data', MISTERIO_SOLUTIONS_FILE),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(
    `No se encontró ${MISTERIO_SOLUTIONS_FILE}. Rutas probadas: ${candidates.join(', ')}`,
  );
}

@Injectable()
export class MisterioSolutionService implements OnModuleInit {
  private solutions: SolutionEntry[] = [];

  onModuleInit(): void {
    const filePath = resolveMisterioSolutionsPath();
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as SolutionsFile;
    this.solutions = parsed.respuestas ?? [];
  }

  evaluate(valor: string): MisterioSolutionCheck {
    const normalized = this.normalizePersonName(valor);
    const match = this.solutions.find(
      (entry) => this.normalizePersonName(entry.nombre) === normalized,
    );

    if (match) {
      return {
        correct: true,
        etapa: match.etapa ?? 1,
        mensaje: match.Descripcion,
      };
    }

    return {
      correct: false,
      etapa: null,
      mensaje: MISTERIO_WRONG_ANSWER_MESSAGE,
    };
  }

  normalizePersonName(name: string): string {
    return name
      .trim()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
  }
}
