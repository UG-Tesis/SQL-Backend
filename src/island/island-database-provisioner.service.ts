import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';
import { getMysqlPoolOptions } from '../config/mysql.config';
import {
  DEFAULT_ISLAND_DATABASE,
  ISLAND_DATABASE_ENV,
} from './data/island-missions.data';
import {
  assertValidIslandSessionId,
  getIslandSessionDatabaseName,
  getIslandTemplateTables,
  quoteMysqlIdentifier,
} from './island-session.util';

@Injectable()
export class IslandDatabaseProvisionerService implements OnModuleDestroy {
  private adminPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {}

  getTemplateDatabaseName(): string {
    return this.configService.get<string>(
      ISLAND_DATABASE_ENV,
      DEFAULT_ISLAND_DATABASE,
    );
  }

  getSessionDatabaseName(sessionId: string): string {
    return getIslandSessionDatabaseName(sessionId);
  }

  private getAdminPool(): Pool {
    if (!this.adminPool) {
      const poolOptions = getMysqlPoolOptions(
        this.configService,
        this.getTemplateDatabaseName(),
      );
      delete poolOptions.database;
      this.adminPool = createPool(poolOptions);
    }
    return this.adminPool;
  }

  async cloneTemplateDatabase(sessionId: string): Promise<string> {
    assertValidIslandSessionId(sessionId);

    const templateDb = this.getTemplateDatabaseName();
    const sessionDb = this.getSessionDatabaseName(sessionId);
    const pool = this.getAdminPool();
    const connection = await pool.getConnection();

    try {
      await connection.query(
        `CREATE DATABASE ${quoteMysqlIdentifier(sessionDb)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );

      const template = quoteMysqlIdentifier(templateDb);
      const target = quoteMysqlIdentifier(sessionDb);

      for (const table of getIslandTemplateTables()) {
        const tableId = quoteMysqlIdentifier(table);
        await connection.query(
          `CREATE TABLE ${target}.${tableId} LIKE ${template}.${tableId}`,
        );
        await connection.query(
          `INSERT INTO ${target}.${tableId} SELECT * FROM ${template}.${tableId}`,
        );
      }

      await connection.query(
        `ALTER TABLE ${target}.${quoteMysqlIdentifier('habitante')}
          ADD CONSTRAINT fk_habitante_pueblo
          FOREIGN KEY (pueblo_id) REFERENCES ${target}.${quoteMysqlIdentifier('pueblo')} (pueblo_id)`,
      );
      await connection.query(
        `ALTER TABLE ${target}.${quoteMysqlIdentifier('objeto')}
          ADD CONSTRAINT fk_objeto_propietario
          FOREIGN KEY (propietario) REFERENCES ${target}.${quoteMysqlIdentifier('habitante')} (habitante_id)
          ON DELETE SET NULL`,
      );
      await connection.query(
        `ALTER TABLE ${target}.${quoteMysqlIdentifier('pueblo')}
          ADD CONSTRAINT fk_pueblo_jefe
          FOREIGN KEY (jefe) REFERENCES ${target}.${quoteMysqlIdentifier('habitante')} (habitante_id)`,
      );

      return sessionDb;
    } catch (error) {
      await this.dropSessionDatabase(sessionId).catch(() => undefined);
      throw error;
    } finally {
      connection.release();
    }
  }

  async dropSessionDatabase(sessionId: string): Promise<void> {
    assertValidIslandSessionId(sessionId);
    const sessionDb = this.getSessionDatabaseName(sessionId);
    const pool = this.getAdminPool();
    await pool.query(
      `DROP DATABASE IF EXISTS ${quoteMysqlIdentifier(sessionDb)}`,
    );
  }

  async onModuleDestroy() {
    await this.adminPool?.end();
    this.adminPool = null;
  }
}
