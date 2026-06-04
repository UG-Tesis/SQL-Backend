import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.get<string>('MYSQL_HOST', 'localhost'),
      port: Number(configService.get<string>('MYSQL_PORT', '3306')),
      user: configService.get<string>('MYSQL_USER', 'root'),
      password: configService.get<string>('MYSQL_PASSWORD', ''),
      database: configService.get<string>('MYSQL_DATABASE', 'tesis_sql'),
      connectionLimit: 5,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
