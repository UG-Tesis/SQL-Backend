export type SqlValidationType =
  | 'create_database'
  | 'drop_database'
  | 'use_database'
  | 'alter_table'
  | 'insert_row'
  | 'update_row'
  | 'delete_row'
  | 'select_query';

export interface SqlValidationResult {
  correct: boolean;
  message: string;
  hints?: string[];
}

export interface TaskExpectation {
  databaseName?: string;
  columnName?: string;
  columnType?: string;
  tableName?: string;
  insertValues?: Record<string, string | number>;
  updateSet?: Record<string, string | number>;
  updateWhere?: Record<string, string | number>;
  deleteWhere?: Record<string, string | number>;
  selectColumns?: string[] | 'all';
  selectTable?: string;
  selectWhere?: Record<string, string | number>;
}

export const MODULO_1_VALIDATION_BY_ORDEN: Record<number, SqlValidationType> = {
  1: 'create_database',
  2: 'drop_database',
  3: 'use_database',
};

export const MODULO_1_TASK_EXPECTATIONS: Record<number, TaskExpectation> = {
  1: { databaseName: 'biblioteca' },
  2: { databaseName: 'biblioteca' },
  3: { databaseName: 'tesis_sandbox' },
};

export const MODULO_2_VALIDATION_BY_ORDEN: Record<number, SqlValidationType> = {
  1: 'insert_row',
  2: 'update_row',
  3: 'delete_row',
};

export const MODULO_2_TASK_EXPECTATIONS: Record<number, TaskExpectation> = {
  1: {
    tableName: 'practica_alumnos',
    insertValues: { nombre: 'Ana López', email: 'ana@mail.com', edad: 22 },
  },
  2: {
    tableName: 'practica_alumnos',
    updateSet: { edad: 23 },
    updateWhere: { id: 1 },
  },
  3: {
    tableName: 'practica_alumnos',
    deleteWhere: { id: 2 },
  },
};

export const MODULO_3_VALIDATION_BY_ORDEN: Record<number, SqlValidationType> = {
  1: 'select_query',
  2: 'select_query',
  3: 'select_query',
};

export const MODULO_3_TASK_EXPECTATIONS: Record<number, TaskExpectation> = {
  1: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
  },
  2: {
    selectTable: 'practica_alumnos',
    selectColumns: 'all',
  },
  3: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    selectWhere: { id: 1 },
  },
};

export const MODULE_VALIDATION_BY_ORDEN: Record<number, Record<number, SqlValidationType>> = {
  1: MODULO_1_VALIDATION_BY_ORDEN,
  2: MODULO_2_VALIDATION_BY_ORDEN,
  3: MODULO_3_VALIDATION_BY_ORDEN,
};

export const MODULE_TASK_EXPECTATIONS: Record<number, Record<number, TaskExpectation>> = {
  1: MODULO_1_TASK_EXPECTATIONS,
  2: MODULO_2_TASK_EXPECTATIONS,
  3: MODULO_3_TASK_EXPECTATIONS,
};

export const SANDBOX_PRACTICE_TABLE = 'practica_alumnos';
