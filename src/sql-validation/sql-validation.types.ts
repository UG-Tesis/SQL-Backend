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
  requiredInsertColumns?: string[];
  updateSet?: Record<string, string | number>;
  updateWhere?: Record<string, string | number>;
  requiredUpdateSetColumns?: string[];
  requiredWhereColumns?: string[];
  deleteWhere?: Record<string, string | number>;
  selectColumns?: string[] | 'all';
  selectTable?: string;
  selectWhere?: Record<string, string | number>;
  requiresOrderBy?: boolean;
  orderByColumn?: string;
  requiresGroupBy?: boolean;
  groupByColumn?: string;
  requiresLimit?: boolean;
  limitValue?: number;
  requiresAggregates?: string[];
  aggregateColumn?: string;
  requiresJoin?: boolean;
  joinTable?: string;
  requiresWhereOperators?: string[];
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
    requiredInsertColumns: ['nombre', 'email', 'edad'],
  },
  2: {
    tableName: 'practica_alumnos',
    requiredUpdateSetColumns: ['edad'],
    requiredWhereColumns: ['id'],
  },
  3: {
    tableName: 'practica_alumnos',
    requiredWhereColumns: ['id'],
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

export const MODULO_4_VALIDATION_BY_ORDEN: Record<number, SqlValidationType> = {
  1: 'select_query',
  2: 'select_query',
  3: 'select_query',
  4: 'select_query',
  5: 'select_query',
  6: 'select_query',
  7: 'select_query',
};

export const MODULO_4_TASK_EXPECTATIONS: Record<number, TaskExpectation> = {
  1: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresOrderBy: true,
    orderByColumn: 'edad',
  },
  2: {
    selectTable: 'practica_alumnos',
    requiresGroupBy: true,
    groupByColumn: 'edad',
    requiresAggregates: ['COUNT'],
  },
  3: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresOrderBy: true,
    orderByColumn: 'edad',
    requiresLimit: true,
    limitValue: 3,
  },
  4: {
    selectTable: 'practica_alumnos',
    requiresAggregates: ['SUM'],
    aggregateColumn: 'edad',
  },
  5: {
    selectTable: 'practica_alumnos',
    requiresAggregates: ['AVG'],
    aggregateColumn: 'edad',
  },
  6: {
    selectTable: 'practica_alumnos',
    requiresAggregates: ['MAX'],
    aggregateColumn: 'edad',
  },
  7: {
    selectTable: 'practica_alumnos',
    requiresAggregates: ['MIN'],
    aggregateColumn: 'edad',
  },
};

export const MODULO_5_VALIDATION_BY_ORDEN: Record<number, SqlValidationType> = {
  1: 'select_query',
  2: 'select_query',
  3: 'select_query',
  4: 'select_query',
  5: 'select_query',
  6: 'select_query',
  7: 'select_query',
  8: 'select_query',
  9: 'select_query',
  10: 'select_query',
  11: 'select_query',
};

export const MODULO_5_TASK_EXPECTATIONS: Record<number, TaskExpectation> = {
  1: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'materia'],
    requiresJoin: true,
    joinTable: 'practica_inscripciones',
  },
  2: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    selectWhere: { id: 1 },
  },
  3: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresWhereOperators: ['<'],
  },
  4: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresWhereOperators: ['>'],
  },
  5: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'email'],
    requiresWhereOperators: ['!='],
  },
  6: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresWhereOperators: ['AND'],
  },
  7: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'email'],
    requiresWhereOperators: ['OR'],
  },
  8: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'email'],
    requiresWhereOperators: ['NOT'],
  },
  9: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresWhereOperators: ['BETWEEN'],
  },
  10: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'edad'],
    requiresWhereOperators: ['IN'],
  },
  11: {
    selectTable: 'practica_alumnos',
    selectColumns: ['nombre', 'email'],
    requiresWhereOperators: ['LIKE'],
  },
};

export const MODULE_VALIDATION_BY_ORDEN: Record<number, Record<number, SqlValidationType>> = {
  1: MODULO_1_VALIDATION_BY_ORDEN,
  2: MODULO_3_VALIDATION_BY_ORDEN,
  3: MODULO_2_VALIDATION_BY_ORDEN,
  4: MODULO_4_VALIDATION_BY_ORDEN,
  5: MODULO_5_VALIDATION_BY_ORDEN,
};

export const MODULE_TASK_EXPECTATIONS: Record<number, Record<number, TaskExpectation>> = {
  1: MODULO_1_TASK_EXPECTATIONS,
  2: MODULO_3_TASK_EXPECTATIONS,
  3: MODULO_2_TASK_EXPECTATIONS,
  4: MODULO_4_TASK_EXPECTATIONS,
  5: MODULO_5_TASK_EXPECTATIONS,
};

export const SANDBOX_PRACTICE_TABLE = 'practica_alumnos';
