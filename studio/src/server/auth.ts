// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { query, run } from './db';
export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
export const verifyPassword = (password: string, hash: string) => {
  const [salt, key] = hash.split(':');
  return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(password, salt, 64));
};
export const tokenHash = (t: string) => createHash('sha256').update(t).digest('hex');
export function cookieToken(req: Request) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('persona_session='))
    ?.split('=')[1];
  return cookie || '';
}
export type AuthRequest = Request & { userId?: string; sessionId?: string };
export async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = cookieToken(req);
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  const rows = await query<{ user_id: string; id: string }>(
    'SELECT user_id,id FROM sessions WHERE id=? AND expires_at>?',
    [tokenHash(token), new Date().toISOString()],
  );
  if (!rows[0]) return res.status(401).json({ error: 'Session expired. Sign in again.' });
  req.userId = rows[0].user_id;
  req.sessionId = rows[0].id;
  next();
}
export async function newSession(userId: string, req: Request, res: Response) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  await run('INSERT INTO sessions(id,user_id,created_at,expires_at,label) VALUES(?,?,?,?,?)', [
    tokenHash(token),
    userId,
    new Date(now).toISOString(),
    new Date(now + 30 * 86400000).toISOString(),
    (req.headers['user-agent'] || 'Browser').slice(0, 200),
  ]);
  res.cookie('persona_session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 86400000,
  });
}
