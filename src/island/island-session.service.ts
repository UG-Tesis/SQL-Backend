import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';
import { getMysqlPoolOptions } from '../config/mysql.config';
import { IslandDatabaseProvisionerService } from './island-database-provisioner.service';
import {
  assertValidIslandSessionId,
  createIslandSessionId,
} from './island-session.util';

interface IslandSessionRecord {
  pool: Pool;
  databaseName: string;
  lastActivityAt: number;
  stepFailures: Map<number, number>;
}

const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class IslandSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly sessions = new Map<string, IslandSessionRecord>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly provisioner: IslandDatabaseProvisionerService,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredSessions();
    }, CLEANUP_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    const sessionIds = [...this.sessions.keys()];
    await Promise.all(
      sessionIds.map((sessionId) => this.closeSession(sessionId)),
    );
  }

  async createSession(): Promise<{ sessionId: string; databaseName: string }> {
    const sessionId = createIslandSessionId();
    const databaseName =
      await this.provisioner.cloneTemplateDatabase(sessionId);
    const pool = createPool(
      getMysqlPoolOptions(this.configService, databaseName),
    );

    this.sessions.set(sessionId, {
      pool,
      databaseName,
      lastActivityAt: Date.now(),
      stepFailures: new Map(),
    });

    return { sessionId, databaseName };
  }

  resumeSession(sessionId: string): { success: true; sessionId: string } {
    assertValidIslandSessionId(sessionId);
    if (!this.hasSession(sessionId)) {
      throw new NotFoundException(
        'La sesión de juego no existe o ya expiró. Vuelve a abrir SQL Island.',
      );
    }

    this.touchSession(sessionId);
    return { success: true, sessionId };
  }

  getSessionPool(sessionId: string): Pool {
    assertValidIslandSessionId(sessionId);
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(
        'La sesión de juego no existe o ya expiró. Vuelve a abrir SQL Island.',
      );
    }

    session.lastActivityAt = Date.now();
    return session.pool;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = Date.now();
    }
  }

  recordStepFailure(sessionId: string, stepIndex: number): number {
    assertValidIslandSessionId(sessionId);
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(
        'La sesión de juego no existe o ya expiró. Vuelve a abrir SQL Island.',
      );
    }

    session.lastActivityAt = Date.now();
    const nextCount = (session.stepFailures.get(stepIndex) ?? 0) + 1;
    session.stepFailures.set(stepIndex, nextCount);
    return nextCount;
  }

  clearStepFailure(sessionId: string, stepIndex: number): void {
    const session = this.sessions.get(sessionId);
    session?.stepFailures.delete(stepIndex);
  }

  resetStepFailures(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    session?.stepFailures.clear();
  }

  async closeSession(sessionId: string): Promise<void> {
    assertValidIslandSessionId(sessionId);
    const session = this.sessions.get(sessionId);

    if (session) {
      this.sessions.delete(sessionId);
      await session.pool.end().catch(() => undefined);
    }

    await this.provisioner
      .dropSessionDatabase(sessionId)
      .catch(() => undefined);
  }

  private getSessionTtlMs(): number {
    return Number(
      this.configService.get<string>(
        'ISLAND_SESSION_TTL_MS',
        String(DEFAULT_SESSION_TTL_MS),
      ),
    );
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const ttlMs = this.getSessionTtlMs();
    const now = Date.now();
    const expired = [...this.sessions.entries()]
      .filter(([, session]) => now - session.lastActivityAt > ttlMs)
      .map(([sessionId]) => sessionId);

    await Promise.all(expired.map((sessionId) => this.closeSession(sessionId)));
  }
}
