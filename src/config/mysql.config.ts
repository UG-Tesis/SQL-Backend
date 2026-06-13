import type { ConfigService } from '@nestjs/config';
import type { PoolOptions } from 'mysql2/promise';

export function isMysqlSslEnabled(configService: ConfigService): boolean {
  return (
    configService.get<string>('MYSQL_SSL', 'false').toLowerCase() === 'true'
  );
}

export function getMysqlConnectionLimit(configService: ConfigService): number {
  return Number(configService.get<string>('MYSQL_CONNECTION_LIMIT', '10'));
}

export function getMysqlSslOptions(configService: ConfigService) {
  if (!isMysqlSslEnabled(configService)) {
    return undefined;
  }

  return { rejectUnauthorized: true };
}

export function getMysqlPoolOptions(
  configService: ConfigService,
  database: string,
): PoolOptions {
  return {
    host: configService.get<string>('MYSQL_HOST', 'localhost'),
    port: Number(configService.get<string>('MYSQL_PORT', '3306')),
    user: configService.get<string>('MYSQL_USER', 'root'),
    password: configService.get<string>('MYSQL_PASSWORD', ''),
    database,
    waitForConnections: true,
    connectionLimit: getMysqlConnectionLimit(configService),
    maxIdle: getMysqlConnectionLimit(configService),
    idleTimeout: 60_000,
    multipleStatements: false,
    ssl: getMysqlSslOptions(configService),
  };
}

export function getPrismaMariaDbConfig(configService: ConfigService) {
  return {
    host: configService.get<string>('MYSQL_HOST', 'localhost'),
    port: Number(configService.get<string>('MYSQL_PORT', '3306')),
    user: configService.get<string>('MYSQL_USER', 'root'),
    password: configService.get<string>('MYSQL_PASSWORD', ''),
    database: configService.get<string>('MYSQL_DATABASE', 'tesis_sql'),
    connectionLimit: getMysqlConnectionLimit(configService),
    ssl: getMysqlSslOptions(configService),
  };
}
