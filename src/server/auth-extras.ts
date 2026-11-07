// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import type { Express, Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { auth, newSession, hashPassword, tokenHash, type AuthRequest } from './auth';
import { query, run, transaction } from './db';
import { id } from '../shared/schema';
const endpoint =
  (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
function failure(res: Response, message: string) {
  return res.status(400).json({ error: message });
}
async function token(userId: string, purpose: string, payload: unknown, minutes: number) {
  const t = randomBytes(32).toString('base64url');
  await run('INSERT INTO auth_tokens(id,user_id,purpose,payload,expires_at) VALUES(?,?,?,?,?)', [
    tokenHash(t),
    userId,
    purpose,
    JSON.stringify(payload),
    new Date(Date.now() + minutes * 60000).toISOString(),
  ]);
  return t;
}
async function consume(t: string, purpose: string, userId?: string) {
  const rows = await query<{ user_id: string; payload: string }>(
    'DELETE FROM auth_tokens WHERE id=? AND purpose=? AND expires_at>?' +
      (userId ? ' AND user_id=?' : '') +
      ' RETURNING user_id,payload',
    [tokenHash(t), purpose, new Date().toISOString(), ...(userId ? [userId] : [])],
  );
  return rows[0];
}
async function email(to: string, subject: string, text: string) {
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM)
    throw Error('SMTP delivery is not configured.');
  await nodemailer
    .createTransport(process.env.SMTP_URL, { disableFileAccess: true, disableUrlAccess: true })
    .sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}
export function installAuthExtras(app: Express) {
  const limited = rateLimit({
    windowMs: 3600000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const origin = () => process.env.APP_ORIGIN || 'http://localhost:3100';
  const rpID = () => new URL(origin()).hostname;
  app.get(
    '/api/auth/status',
    auth,
    endpoint(async (req, res) => {
      const [s] = await query<{ verified_at: string }>(
        'SELECT verified_at FROM email_status WHERE user_id=?',
        [req.userId],
      );
      const passkeys = await query('SELECT id,name,created_at FROM passkeys WHERE user_id=?', [
        req.userId,
      ]);
      res.json({
        verified: !!s?.verified_at,
        emailConfigured: !!process.env.SMTP_URL && !!process.env.MAIL_FROM,
        passkeys,
      });
    }),
  );
  app.post(
    '/api/auth/verification/request',
    auth,
    limited,
    endpoint(async (req, res) => {
      if (!process.env.SMTP_URL)
        return res.status(503).json({
          error: 'Email verification requires SMTP configuration by the instance operator.',
        });
      const [u] = await query<{ email: string }>('SELECT email FROM users WHERE id=?', [
        req.userId,
      ]);
      const t = await token(req.userId!, 'verify', {}, 60);
      await email(
        u.email,
        'Verify your Persona email',
        `Open Persona and confirm your email with this single-use link:\n${origin()}/#verify/${t}\nThis link expires in one hour.`,
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    '/api/auth/verification/confirm',
    limited,
    endpoint(async (req, res) => {
      const { token: t } = z.object({ token: z.string().min(20).max(200) }).parse(req.body);
      const record = await consume(t, 'verify');
      if (!record) return failure(res, 'This verification link expired or was already used.');
      await run(
        'INSERT INTO email_status(user_id,verified_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET verified_at=excluded.verified_at',
        [record.user_id, new Date().toISOString()],
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    '/api/auth/password/request',
    limited,
    endpoint(async (req, res) => {
      const { email: address } = z
        .object({ email: z.email().transform((v) => v.toLowerCase()) })
        .parse(req.body);
      if (!process.env.SMTP_URL)
        return res.status(503).json({
          error: 'Password recovery requires SMTP configuration by the instance operator.',
        });
      const [u] = await query<{ id: string }>('SELECT id FROM users WHERE email=?', [address]);
      if (u) {
        const t = await token(u.id, 'reset', {}, 20);
        await email(
          address,
          'Reset your Persona password',
          `Open this single-use link to choose a new password:\n${origin()}/#reset/${t}\nExpires in 20 minutes. If you did not request a reset, ignore this message.`,
        );
      }
      res.json({ ok: true, message: 'If this account exists, a recovery email has been sent.' });
    }),
  );
  app.post(
    '/api/auth/password/reset',
    limited,
    endpoint(async (req, res) => {
      const input = z
        .object({ token: z.string().min(20).max(200), password: z.string().min(12).max(256) })
        .parse(req.body);
      const record = await consume(input.token, 'reset');
      if (!record) return failure(res, 'This recovery link expired or was already used.');
      await transaction(async (tx) => {
        await tx.run('UPDATE users SET password=? WHERE id=?', [
          hashPassword(input.password),
          record.user_id,
        ]);
        await tx.run('DELETE FROM sessions WHERE user_id=?', [record.user_id]);
        await tx.run("DELETE FROM auth_tokens WHERE user_id=? AND purpose='reset'", [
          record.user_id,
        ]);
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    '/api/auth/passkeys/register/options',
    auth,
    limited,
    endpoint(async (req, res) => {
      const [u] = await query<{ email: string }>('SELECT email FROM users WHERE id=?', [
        req.userId,
      ]);
      const keys = await query<{ id: string }>('SELECT id FROM passkeys WHERE user_id=?', [
        req.userId,
      ]);
      const options = await generateRegistrationOptions({
        rpName: 'Persona',
        rpID: rpID(),
        userName: u.email,
        userID: new TextEncoder().encode(req.userId!),
        attestationType: 'none',
        excludeCredentials: keys.map((k) => ({ id: k.id })),
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      });
      const challengeId = await token(
        req.userId!,
        'webauthn-register',
        { challenge: options.challenge },
        5,
      );
      res.json({ options, challengeId });
    }),
  );
  app.post(
    '/api/auth/passkeys/register/verify',
    auth,
    limited,
    endpoint(async (req, res) => {
      const { challengeId, response, name } = z
        .object({
          challengeId: z.string().max(200),
          response: z.record(z.string(), z.unknown()),
          name: z.string().min(1).max(100),
        })
        .parse(req.body);
      const challenge = await consume(challengeId, 'webauthn-register', req.userId);
      if (!challenge) return failure(res, 'Passkey challenge expired. Start again.');
      try {
        const result = await verifyRegistrationResponse({
          response: response as unknown as RegistrationResponseJSON,
          expectedChallenge: JSON.parse(challenge.payload).challenge,
          expectedOrigin: origin(),
          expectedRPID: rpID(),
          requireUserVerification: true,
        });
        if (!result.verified || !result.registrationInfo)
          return failure(res, 'Passkey registration failed.');
        const credential = result.registrationInfo.credential;
        await run(
          'INSERT INTO passkeys(id,user_id,name,public_key,counter,created_at) VALUES(?,?,?,?,?,?)',
          [
            credential.id,
            req.userId,
            name,
            Buffer.from(credential.publicKey).toString('base64url'),
            credential.counter,
            new Date().toISOString(),
          ],
        );
        res.json({ ok: true });
      } catch {
        return failure(res, 'Passkey response could not be verified.');
      }
    }),
  );
  app.post(
    '/api/auth/passkeys/login/options',
    limited,
    endpoint(async (req, res) => {
      const options = await generateAuthenticationOptions({
        rpID: rpID(),
        userVerification: 'required',
      });
      const challengeId = await token(
        'anonymous',
        'webauthn-login',
        { challenge: options.challenge },
        5,
      );
      res.json({ options, challengeId });
    }),
  );
  app.post(
    '/api/auth/passkeys/login/verify',
    limited,
    endpoint(async (req, res) => {
      const { challengeId, response } = z
        .object({ challengeId: z.string().max(200), response: z.record(z.string(), z.unknown()) })
        .parse(req.body);
      const challenge = await consume(challengeId, 'webauthn-login');
      if (!challenge) return failure(res, 'Passkey challenge expired.');
      const [key] = await query<{
        id: string;
        user_id: string;
        public_key: string;
        counter: number;
      }>('SELECT * FROM passkeys WHERE id=?', [response.id]);
      if (!key) return failure(res, 'Passkey not recognized.');
      try {
        const result = await verifyAuthenticationResponse({
          response: response as unknown as AuthenticationResponseJSON,
          expectedChallenge: JSON.parse(challenge.payload).challenge,
          expectedOrigin: origin(),
          expectedRPID: rpID(),
          credential: {
            id: key.id,
            publicKey: new Uint8Array(Buffer.from(key.public_key, 'base64url')),
            counter: key.counter,
          },
          requireUserVerification: true,
        });
        if (!result.verified) return failure(res, 'Passkey verification failed.');
        const updated = await query(
          'UPDATE passkeys SET counter=? WHERE id=? AND counter=? RETURNING id',
          [result.authenticationInfo.newCounter, key.id, key.counter],
        );
        if (!updated.length) return failure(res, 'Credential changed; retry sign in.');
        await newSession(key.user_id, req, res);
        const [user] = await query('SELECT id,email FROM users WHERE id=?', [key.user_id]);
        res.json(user);
      } catch {
        return failure(res, 'Passkey response could not be verified.');
      }
    }),
  );
  app.delete(
    '/api/auth/passkeys/:id',
    auth,
    endpoint(async (req, res) => {
      await run('DELETE FROM passkeys WHERE id=? AND user_id=?', [req.params.id, req.userId]);
      res.json({ ok: true });
    }),
  );
}
