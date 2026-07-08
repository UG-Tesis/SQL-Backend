import { formatIslandExpectedHint } from '../island-sql-normalize';

export const ISLAND_DATABASE_ENV = 'MYSQL_ISLAND_DATABASE';
export const DEFAULT_ISLAND_DATABASE = 'tesis_island';

export const ISLAND_PLAYER_ID = 20;

/** Tras cuántos intentos fallidos se revela la pista del paso */
export const ISLAND_HINT_AFTER_FAILURES = 3;

export type IslandStepKind = 'narrative' | 'select' | 'dml';

export interface IslandStepDefinition {
  /** Texto que ve el jugador antes de escribir SQL */
  narrative: string;
  /** Respuesta narrativa tras completar el paso */
  answer?: string;
  /** Texto adicional mostrado al pulsar Continuar (antes del siguiente paso) */
  followUp?: string;
  kind: IslandStepKind;
  /** Si es true, el paso se completa con Continuar (opcionalmente ejecuta demoSql) */
  autoComplete?: boolean;
  demoSql?: string | string[];
  /** Consulta de referencia para pistas; la validación acepta variantes equivalentes. */
  solution?: string;
  /** Para DML: consulta de verificación y número de filas esperadas */
  verificationQuery?: string;
  verificationCount?: number;
  hint?: string;
}

export interface IslandMissionDefinition {
  id: number;
  title: string;
  summary: string;
  steps: IslandStepDefinition[];
}

export const ISLAND_MISSIONS: IslandMissionDefinition[] = [
  {
    id: 1,
    title: 'Explorar la isla',
    summary: 'SELECT básico y filtros con WHERE',
    steps: [
      {
        narrative:
          '¡Vaya! Parece que soy el único superviviente del accidente aéreo. Afortunadamente aterricé en una isla con varios pueblos. Primero quiero ver qué pueblos hay.',
        kind: 'narrative',
        autoComplete: true,
        demoSql: 'SELECT * FROM pueblo',
        answer: 'Hay tres pueblos: Ciudad Mono, Pueblo Pepino y Villa Cebolla.',
      },
      {
        narrative:
          'Y también hay muchos habitantes. Muéstrame la lista completa de habitantes.',
        kind: 'select',
        solution: 'SELECT * FROM habitante',
        answer: '¡Hay mucha gente en esta isla!',
      },
      {
        narrative:
          'Tengo mucha hambre. Busca un carnicero al que pueda pedirle un poco de comida.',
        kind: 'select',
        solution: "SELECT * FROM habitante WHERE profesion = 'Carnicero'",
        answer:
          '¡Aquí, que te siente bien! Y cuidado con los habitantes hostiles mientras no tengas armas: no todos son amigables.',
      },
      {
        narrative:
          'Gracias Erich. Entonces debo averiguar qué habitantes son amigables.',
        kind: 'select',
        solution: "SELECT * FROM habitante WHERE estado = 'amigable'",
      },
    ],
  },
  {
    id: 2,
    title: 'Buscar aliados',
    summary: 'WHERE con AND, OR y LIKE',
    steps: [
      {
        narrative:
          'En algún momento necesitaré una espada. Busca un armero amigable que pueda forjarme una. (Pista: une condiciones con AND en el WHERE.)',
        kind: 'select',
        solution:
          "SELECT * FROM habitante WHERE profesion = 'Armero' AND estado = 'amigable'",
      },
      {
        narrative:
          "Son pocos. Quizá haya más herreros amigables: herrero, herrero de cascos, armero… Prueba profesion LIKE '%herrero' (% es comodín para cualquier texto antes).",
        kind: 'select',
        solution:
          "SELECT * FROM habitante WHERE profesion LIKE '%herrero' AND estado = 'amigable'",
        answer: '¡Mucho mejor! Visitaré a estos herreros uno por uno.',
      },
    ],
  },
  {
    id: 3,
    title: 'Registro y objetos',
    summary: 'INSERT, UPDATE y IS NULL',
    steps: [
      {
        narrative:
          'Hola extranjero, ¿adónde vas? Soy Pablo, alcalde de Ciudad Mono. Te registraré como habitante de mi pueblo.',
        kind: 'narrative',
        autoComplete: true,
        demoSql:
          "INSERT INTO habitante (nombre, pueblo_id, genero, profesion, oro, estado) VALUES ('Extranjero', 1, '?', '?', 0, '?')",
        answer: 'Listo. Ya figuras registrado en Ciudad Mono.',
        followUp:
          '¡Oye, no me llames Extranjero! Bueno… ¿cuál es mi habitante_id? (Pista: usa SELECT con columnas concretas, no *.)',
      },
      {
        narrative: '¿Cuál es mi habitante_id?',
        kind: 'select',
        solution:
          "SELECT habitante_id FROM habitante WHERE nombre = 'Extranjero'",
      },
      {
        narrative: '¡Hola, Ernesto! ¿Cuánto cuesta una espada?',
        kind: 'select',
        solution: "SELECT oro FROM habitante WHERE nombre = 'Extranjero'",
        followUp:
          '¡Maldición! Sin monedas, sin diversión. Debe haber otra forma de ganar oro sin ir a trabajar todavía. ¡Quizá pueda recoger objetos sin dueño y venderlos!',
      },
      {
        narrative:
          'Vi objetos sin dueño por la isla. Lista los objetos cuyo propietario sea NULL.',
        kind: 'select',
        solution: 'SELECT * FROM objeto WHERE propietario IS NULL',
        answer: '¡Tantas cosas útiles! ¡Genial, una taza de café!',
        followUp: 'Voy a recogerla.',
      },
      {
        narrative: 'Recoges la taza de café.',
        kind: 'narrative',
        autoComplete: true,
        demoSql:
          "UPDATE objeto SET propietario = 20 WHERE nombre = 'Taza de café'",
      },
      {
        narrative:
          '¿Hay algún truco para reclamar de una vez el resto de objetos sin dueño?',
        kind: 'dml',
        solution:
          'UPDATE objeto SET propietario = 20 WHERE propietario IS NULL',
        verificationQuery: 'SELECT * FROM objeto WHERE propietario = 20',
        verificationCount: 6,
        followUp: '¡Genial! ¿Qué objetos tengo ahora?',
      },
      {
        narrative: '¿Qué objetos poseo ahora?',
        kind: 'select',
        solution: 'SELECT * FROM objeto WHERE propietario = 20',
      },
    ],
  },
  {
    id: 4,
    title: 'Comercio y trabajo',
    summary: 'OR con paréntesis y ORDER BY',
    steps: [
      {
        narrative:
          'Busca habitantes amigables con profesión Mercader o Comerciante. (Pista: agrupa OR con paréntesis cuando combines con AND.)',
        kind: 'select',
        solution:
          "SELECT * FROM habitante WHERE (profesion = 'Mercader' OR profesion = 'Comerciante') AND estado = 'amigable'",
      },
      {
        narrative:
          'Me interesan el Anillo y la Tetera; el resto es chatarra. Dame esos dos objetos. Mi habitante_id es 15.',
        kind: 'dml',
        solution:
          "UPDATE objeto SET propietario = 15 WHERE nombre = 'Tetera' OR nombre = 'Anillo'",
        verificationQuery:
          "SELECT * FROM objeto WHERE propietario = 15 AND (nombre = 'Tetera' OR nombre = 'Anillo')",
        verificationCount: 2,
        answer: '¡Gracias!',
        followUp: '¡Aquí tienes un montón de oro!',
      },
      {
        narrative: 'Helga te entrega el oro. Tu saldo aumenta en 120 monedas.',
        kind: 'narrative',
        autoComplete: true,
        demoSql: 'UPDATE habitante SET oro = oro + 120 WHERE habitante_id = 20',
      },
      {
        narrative:
          'Aún no alcanza para una espada. Cambiaré mi nombre de Extranjero a Pedro antes de buscar trabajo.',
        kind: 'dml',
        solution:
          "UPDATE habitante SET nombre = 'Pedro' WHERE habitante_id = 20",
        verificationQuery:
          "SELECT * FROM habitante WHERE nombre = 'Extranjero'",
        verificationCount: 0,
      },
      {
        narrative:
          'Quiero trabajar como panadero. Muestra todos los panaderos ordenados del más rico al más pobre. (Pista: ORDER BY oro DESC.)',
        kind: 'select',
        solution:
          "SELECT * FROM habitante WHERE profesion = 'Panadero' ORDER BY oro DESC",
        answer: '¡Ah, Pablo! ¡Lo conozco!',
      },
      {
        narrative:
          '¡Hola otra vez! Así que te llamas Pedro. Vi que quieres trabajar de panadero. ¡De acuerdo! Te pagaré 1 de oro por cada 100 panes.',
        kind: 'narrative',
        autoComplete: true,
      },
      {
        narrative:
          '(Ocho horas después…) ¡He hecho diez mil panes! Renuncio. Debería tener oro suficiente para la espada. Veamos qué pasa con mi saldo.',
        kind: 'narrative',
        autoComplete: true,
      },
      {
        narrative: '¡Ernesto! Aquí tienes los 150 de oro por la espada.',
        kind: 'narrative',
        autoComplete: true,
        demoSql: [
          'UPDATE habitante SET oro = oro + 100 - 150 WHERE habitante_id = 20',
          "INSERT INTO objeto (nombre, propietario) VALUES ('Espada', 20)",
        ],
        answer:
          '¡Aquí tienes tu nueva espada, Pedro! Ahora puedes ir a cualquier parte.',
        followUp: '¡Gracias, Ernesto!',
      },
    ],
  },
  {
    id: 5,
    title: 'Rescatar al piloto',
    summary: 'JOIN y COUNT',
    steps: [
      {
        narrative: '¿Hay algún piloto en la isla? Podría volver a casa.',
        kind: 'select',
        solution: "SELECT * FROM habitante WHERE profesion = 'Piloto'",
        answer: "Está con estado 'prisionero'.",
      },
      {
        narrative:
          '¡Dieter Sucio tiene al piloto prisionero! Te enseño un truco: averigua en qué pueblo vive Dieter Sucio uniendo pueblo y habitante.',
        kind: 'narrative',
        autoComplete: true,
        demoSql:
          "SELECT pueblo.nombre FROM pueblo, habitante WHERE pueblo.pueblo_id = habitante.pueblo_id AND habitante.nombre = 'Dieter Sucio'",
        followUp:
          'Así se hace un JOIN. Ahora busca al jefe de Villa Cebolla: en pueblo.jefe está el habitante_id del jefe.',
      },
      {
        narrative: '¿Cómo se llama el jefe de Villa Cebolla?',
        kind: 'select',
        solution:
          "SELECT habitante.nombre FROM pueblo, habitante WHERE pueblo.jefe = habitante.habitante_id AND pueblo.nombre = 'Villa Cebolla'",
        answer: '¡Lo tengo! Iré a ver a Fritz.',
      },
      {
        narrative: '¿Cuántos habitantes tiene Villa Cebolla?',
        kind: 'select',
        solution:
          "SELECT COUNT(*) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Villa Cebolla'",
        autoComplete: true,
        demoSql:
          "SELECT COUNT(*) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Villa Cebolla'",
      },
      {
        narrative:
          "Pedro, Dieter tiene al piloto en casa de su hermana. ¿Cuántas mujeres hay en Villa Cebolla? (genero = 'f')",
        kind: 'select',
        solution:
          "SELECT COUNT(*) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Villa Cebolla' AND habitante.genero = 'f'",
      },
      {
        narrative: 'Solo una mujer. Veamos cómo se llama.',
        kind: 'select',
        solution:
          "SELECT habitante.nombre FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Villa Cebolla' AND habitante.genero = 'f'",
        answer: '¡Allá voy!',
      },
    ],
  },
  {
    id: 6,
    title: 'Agregaciones',
    summary: 'SUM, AVG, GROUP BY y HAVING',
    steps: [
      {
        narrative:
          'Dieter Sucio pide todo el oro de Pueblo Pepino para liberar al piloto. ¿Cuánto oro tienen juntos los habitantes de Pueblo Pepino?',
        kind: 'select',
        solution:
          "SELECT SUM(habitante.oro) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Pueblo Pepino'",
        autoComplete: true,
        demoSql:
          "SELECT SUM(habitante.oro) FROM habitante, pueblo WHERE pueblo.pueblo_id = habitante.pueblo_id AND pueblo.nombre = 'Pueblo Pepino'",
      },
      {
        narrative:
          'Como mucho podría ganar lo que tienen juntos mercaderes, comerciantes y panaderos. ¿Cuánto es?',
        kind: 'select',
        solution:
          "SELECT SUM(habitante.oro) FROM habitante WHERE profesion = 'Mercader' OR profesion = 'Comerciante' OR profesion = 'Panadero'",
        answer: 'Es demasiado poco…',
      },
      {
        narrative:
          'Veamos el oro total y promedio por profesión, ordenado por promedio.',
        kind: 'select',
        solution:
          'SELECT profesion, SUM(habitante.oro), AVG(habitante.oro) FROM habitante GROUP BY profesion ORDER BY AVG(habitante.oro)',
        autoComplete: true,
        demoSql:
          'SELECT profesion, SUM(habitante.oro), AVG(habitante.oro) FROM habitante GROUP BY profesion ORDER BY AVG(habitante.oro)',
      },
      {
        narrative:
          '¿Cuál es el oro promedio de cada grupo según estado (amigable, hostil, prisionero)?',
        kind: 'select',
        solution:
          'SELECT estado, AVG(habitante.oro) FROM habitante GROUP BY estado',
        answer: 'Entonces tendré que enfrentar a los hostiles…',
      },
    ],
  },
  {
    id: 7,
    title: 'Confrontación',
    summary: 'DELETE',
    steps: [
      {
        narrative:
          'Eliminaré a Dieter Sucio con mi espada y liberaré al piloto.',
        kind: 'dml',
        solution: "DELETE FROM habitante WHERE nombre = 'Dieter Sucio'",
        verificationQuery:
          "SELECT * FROM habitante WHERE nombre = 'Dieter Sucio'",
        verificationCount: 0,
        autoComplete: true,
        demoSql: "DELETE FROM habitante WHERE nombre = 'Dieter Sucio'",
      },
      {
        narrative: '¡Oye! ¿Qué harás ahora, Pedro?',
        kind: 'dml',
        solution: "DELETE FROM habitante WHERE nombre = 'Dorotea Sucia'",
        verificationQuery:
          "SELECT * FROM habitante WHERE nombre = 'Dorotea Sucia'",
        verificationCount: 0,
        answer: '¡Sí! Solo falta liberar al piloto.',
      },
    ],
  },
  {
    id: 8,
    title: 'Escapar de la isla',
    summary: 'UPDATE final',
    steps: [
      {
        narrative: 'Libera al piloto cambiando su estado a amigable.',
        kind: 'dml',
        solution:
          "UPDATE habitante SET estado = 'amigable' WHERE profesion = 'Piloto'",
        verificationQuery:
          "SELECT * FROM habitante WHERE estado = 'amigable' AND profesion = 'Piloto'",
        verificationCount: 1,
        followUp:
          '¡Muchas gracias, Pedro! Te llevo a casa. Me llevo la espada, un poco de oro y algunos recuerdos. ¡Qué aventura!',
      },
      {
        narrative: 'Marca tu personaje como emigrado para cerrar la partida.',
        kind: 'dml',
        solution:
          "UPDATE habitante SET estado = 'emigrado' WHERE habitante_id = 20",
        verificationQuery:
          "SELECT * FROM habitante WHERE habitante_id = 20 AND estado = 'emigrado'",
        verificationCount: 1,
        answer: '¡Has escapado de SQL Island! Felicidades.',
      },
    ],
  },
];

export function getIslandFlatSteps(): IslandStepDefinition[] {
  return ISLAND_MISSIONS.flatMap((mission) => mission.steps);
}

export function getIslandStepCount(): number {
  return getIslandFlatSteps().length;
}

export function getIslandMissionForStep(
  stepIndex: number,
): IslandMissionDefinition | null {
  let offset = 0;
  for (const mission of ISLAND_MISSIONS) {
    if (stepIndex < offset + mission.steps.length) {
      return mission;
    }
    offset += mission.steps.length;
  }
  return null;
}

export function getIslandStep(stepIndex: number): IslandStepDefinition | null {
  const steps = getIslandFlatSteps();
  return steps[stepIndex] ?? null;
}

export function getIslandStepHint(stepIndex: number): string | undefined {
  const step = getIslandStep(stepIndex);
  if (!step?.solution || step.autoComplete) {
    return undefined;
  }
  return formatIslandExpectedHint(step.solution);
}

export function getIslandMissionProgress(stepIndex: number): {
  missionId: number;
  missionTitle: string;
  missionIndex: number;
  stepInMission: number;
  stepsInMission: number;
  totalMissions: number;
} | null {
  let offset = 0;
  for (
    let missionIndex = 0;
    missionIndex < ISLAND_MISSIONS.length;
    missionIndex++
  ) {
    const mission = ISLAND_MISSIONS[missionIndex];
    if (stepIndex < offset + mission.steps.length) {
      return {
        missionId: mission.id,
        missionTitle: mission.title,
        missionIndex,
        stepInMission: stepIndex - offset + 1,
        stepsInMission: mission.steps.length,
        totalMissions: ISLAND_MISSIONS.length,
      };
    }
    offset += mission.steps.length;
  }
  return null;
}
