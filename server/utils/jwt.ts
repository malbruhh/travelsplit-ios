import jwt from 'jsonwebtoken';
import { db } from '../db';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'travelsplit_access_super_secret_key_2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'travelsplit_refresh_super_secret_key_2026';

export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Generates a short-lived stateless JWT access token (15 min)
 */
export function generateAccessToken(payload: TokenPayload): string {
  const nonce = Math.random().toString(36).substr(2, 8);
  return jwt.sign({ ...payload, nonce }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates a long-lived JWT refresh token (30 days) and persists to SQLite database
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const nonce = Math.random().toString(36).substr(2, 8);
  const token = jwt.sign({ ...payload, nonce }, REFRESH_TOKEN_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const id = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, userId, token, expiresAt, revoked, createdAt)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, payload.userId, token, expiresAt, now);

  return token;
}

/**
 * Verifies access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies refresh token and checks if it was revoked or expired in the database
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;

    const row = db.prepare(`
      SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0
    `).get(token) as any;

    if (!row) return null;

    if (new Date(row.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Revokes a refresh token (e.g. on logout or token rotation)
 */
export function revokeRefreshToken(token: string): void {
  db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`).run(token);
}

/**
 * Revokes all refresh tokens for a user (e.g. on security reset / password change)
 */
export function revokeAllUserTokens(userId: string): void {
  db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE userId = ?`).run(userId);
}
