import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FieldPacket, Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';
import { getMysqlPoolOptions } from '../config/mysql.config';
import {
  assertSandboxSqlAllowed,
  DEFAULT_SANDBOX_DATABASE,
  SANDBOX_DATABASE_ENV,
} from './sql-executor.validation';

export interface SqlColumnMeta {
  name: string;
  type: string;
}

export interface SqlExecutionResult {
  success: boolean;
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: SqlColumnMeta[];
  affectedRows?: number;
  insertId?: number;
  message: string;
}

const MAX_SELECT_ROWS = 500;

@Injectable()
export class SqlExecutorService implements OnModuleDestroy {
  private pool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getPool(): Pool {
    if (!this.pool) {
      const sandboxDatabase = this.configService.get<string>(
        SANDBOX_DATABASE_ENV,
        DEFAULT_SANDBOX_DATABASE,
      );

      this.pool = createPool(getMysqlPoolOptions(this.configService, sandboxDatabase));
    }
    return this.pool;
  }

  getSandboxDatabase(): string {
    return this.configService.get<string>(SANDBOX_DATABASE_ENV, DEFAULT_SANDBOX_DATABASE);
  }

  async execute(sql: string): Promise<SqlExecutionResult> {
    const statement = this.applySelectRowLimit(this.validateAndNormalize(sql));

    try {
      const pool = this.getPool();
      const [result, fields] = await pool.query<RowDataPacket[] | ResultSetHeader>(statement);

      if (Array.isArray(result)) {
        const rows = result.map((row) => this.serializeRow(row));
        return {
          success: true,
          rows,
          rowCount: rows.length,
          columns: this.mapColumns(fields),
          message:
            rows.length === 0
              ? 'Consulta ejecutada sin registros.'
              : `Consulta ejecutada. ${rows.length} registro(s).`,
        };
      }

      const header = result;
      return {
        success: true,
        rows: [],
        rowCount: 0,
        columns: [],
        affectedRows: header.affectedRows,
        insertId: header.insertId > 0 ? header.insertId : undefined,
        message: `Sentencia ejecutada. Filas afectadas: ${header.affectedRows ?? 0}.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al ejecutar SQL';
      throw new BadRequestException(message);
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private validateAndNormalize(sql: string): string {
    const trimmed = sql.trim();
    if (!trimmed) {
      throw new BadRequestException('La sentencia SQL no puede estar vacía.');
    }

    if (trimmed.length > 8000) {
      throw new BadRequestException('La sentencia SQL supera el tamaño permitido.');
    }

    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    if (!withoutComments) {
      throw new BadRequestException('La sentencia SQL no puede estar vacía.');
    }

    const sanitized = withoutComments.replace(/;+\s*$/g, '').trim();
    if (!sanitized) {
      throw new BadRequestException('La sentencia SQL no puede estar vacía.');
    }

    if (sanitized.includes(';')) {
      throw new BadRequestException('Solo se permite ejecutar una sentencia SQL a la vez.');
    }

    const checkTarget = sanitized
      .replace(/'([^'\\]|\\.)*'/g, "''")
      .replace(/"([^"\\]|\\.)*"/g, '""')
      .replace(/`([^`\\]|\\.)*`/g, '``');

    try {
      assertSandboxSqlAllowed(checkTarget);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operación no permitida.';
      throw new BadRequestException(message);
    }

    return sanitized;
  }

  private applySelectRowLimit(statement: string): string {
    const checkTarget = statement
      .replace(/'([^'\\]|\\.)*'/g, "''")
      .replace(/"([^"\\]|\\.)*"/g, '""')
      .replace(/`([^`\\]|\\.)*`/g, '``')
      .trim();

    if (!/^\s*SELECT\b/i.test(checkTarget)) {
      return statement;
    }

    if (/\bLIMIT\b/i.test(checkTarget)) {
      return statement;
    }

    return `${statement} LIMIT ${MAX_SELECT_ROWS}`;
  }

  private mapColumns(fields?: FieldPacket[]): SqlColumnMeta[] {
    if (!fields?.length) return [];
    return fields.map((field) => ({
      name: field.name,
      type: this.describeFieldType(field),
    }));
  }

  private describeFieldType(field: FieldPacket): string {
    const typeId = field.type ?? 0;
    const typeNames: Record<number, string> = {
      0: 'decimal',
      1: 'tinyint',
      2: 'smallint',
      3: 'int',
      4: 'float',
      5: 'double',
      7: 'timestamp',
      8: 'bigint',
      9: 'mediumint',
      10: 'date',
      11: 'time',
      12: 'datetime',
      13: 'year',
      15: 'varchar',
      16: 'bit',
      245: 'json',
      246: 'decimal',
      253: 'varchar',
      254: 'char',
    };
    return typeNames[typeId] ?? 'unknown';
  }

  private serializeRow(row: RowDataPacket): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      output[key] = this.serializeValue(value);
    }
    return output;
  }

  private serializeValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'object') {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return String(value);
      }
    }
    return value;
  }
}
