import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../../../server/utils/jwt';
import { db } from '../../../server/db';

describe('Dual-Token JWT Authentication & Security', () => {
  const mockUser = {
    userId: 'user-unit-test-123',
    email: 'test@travelsplit.app',
    name: 'Unit Tester',
  };

  beforeAll(() => {
    // Ensure mock user exists in DB for foreign key constraint
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, avatarColor, defaultCurrency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(mockUser.userId, mockUser.name, mockUser.email, '#007AFF', 'USD', new Date().toISOString());
  });

  it('generates valid short-lived access token with correct payload', () => {
    const accessToken = generateAccessToken(mockUser);
    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    const decoded = verifyAccessToken(accessToken);
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(mockUser.userId);
    expect(decoded?.email).toBe(mockUser.email);
    expect(decoded?.name).toBe(mockUser.name);
  });

  it('generates long-lived refresh token and persists in database', () => {
    const refreshToken = generateRefreshToken(mockUser);
    expect(refreshToken).toBeDefined();

    // Verify against DB
    const row = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken) as any;
    expect(row).toBeDefined();
    expect(row.userId).toBe(mockUser.userId);
    expect(row.revoked).toBe(0);

    const verified = verifyRefreshToken(refreshToken);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(mockUser.userId);
  });

  it('revokes refresh token preventing token reuse', () => {
    const refreshToken = generateRefreshToken(mockUser);
    expect(verifyRefreshToken(refreshToken)).not.toBeNull();

    // Revoke token
    revokeRefreshToken(refreshToken);

    // Should now fail verification
    const verifiedAfterRevoke = verifyRefreshToken(refreshToken);
    expect(verifiedAfterRevoke).toBeNull();
  });

  it('hashes and securely verifies passwords with bcrypt', () => {
    const rawPassword = 'SuperSecretTripPass2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    expect(bcrypt.compareSync(rawPassword, hash)).toBe(true);
    expect(bcrypt.compareSync('WrongPassword', hash)).toBe(false);
  });
});
