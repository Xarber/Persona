// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
export const dataDir = path.resolve(process.env.DATA_DIR || '.data');
mkdirSync(dataDir, { recursive: true });
const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const sqlite = pool ? null : new DatabaseSync(path.join(dataDir, 'persona.sqlite'));
if (sqlite) {
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
}
export interface Db {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  run: (sql: string, params?: unknown[]) => Promise<void>;
}
function adapter(client: pg.Pool | pg.PoolClient | null): Db {
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      if (client) {
        let i = 0;
        return (
          await client.query(
            sql.replace(/\?/g, () => `$${++i}`),
            params,
          )
        ).rows as T[];
      }
      return sqlite!.prepare(sql).all(...(params as (string | number | null)[])) as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      if (client) {
        let i = 0;
        await client.query(
          sql.replace(/\?/g, () => `$${++i}`),
          params,
        );
      } else sqlite!.prepare(sql).run(...(params as (string | number | null)[]));
    },
  };
}
const direct = adapter(pool);
let tail: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = tail.then(fn, fn);
  tail = next.then(
    () => {},
    () => {},
  );
  return next;
}
export function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return serialized(() => direct.query<T>(sql, params));
}
export function run(sql: string, params: unknown[] = []) {
  return serialized(() => direct.run(sql, params));
}
export function transaction<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return serialized(async () => {
    const client = pool ? await pool.connect() : null;
    const db = adapter(client);
    try {
      await db.run('BEGIN');
      const result = await fn(db);
      await db.run('COMMIT');
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    } finally {
      client?.release();
    }
  });
}
export const migrations = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,label TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS websites (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,document TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,published_version INTEGER,deployment_id TEXT,archived INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS websites_owner ON websites(user_id)`,
  `CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY,site_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,version INTEGER NOT NULL,document TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(site_id,version))`,
  `CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,filename TEXT NOT NULL,original TEXT NOT NULL,alt TEXT NOT NULL,created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS deployments (id TEXT PRIMARY KEY,site_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,version INTEGER NOT NULL,document TEXT NOT NULL,status TEXT NOT NULL,log TEXT NOT NULL,created_at TEXT NOT NULL,completed_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS domains (id TEXT PRIMARY KEY,site_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,hostname TEXT UNIQUE NOT NULL,token TEXT NOT NULL,verified_at TEXT,routing INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY,site_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,name TEXT NOT NULL,email TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ideas (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS analytics (site_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,day TEXT NOT NULL,path TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(site_id,day,path))`,
  `CREATE TABLE IF NOT EXISTS preferences (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS email_status (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,verified_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS auth_tokens (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,purpose TEXT NOT NULL,payload TEXT NOT NULL,expires_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS passkeys (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,public_key TEXT NOT NULL,counter INTEGER NOT NULL,created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,user_id TEXT,action TEXT NOT NULL,resource TEXT NOT NULL,created_at TEXT NOT NULL)`,
];
export async function migrate() {
  for (const sql of migrations) await run(sql);
  await run(
    'INSERT INTO schema_migrations(version,applied_at) VALUES(1,?) ON CONFLICT(version) DO NOTHING',
    [new Date().toISOString()],
  );
}
export async function closeDb() {
  if (pool) await pool.end();
  else sqlite?.close();
}
