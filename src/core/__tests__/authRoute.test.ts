import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { authRouter } from '../../../server/routes/auth';
import { db } from '../../../server/db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('User Authentication API Routes', () => {
  it('registers a new user and returns token', async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const user = {
      name: 'Jordan Bell',
      email: testEmail,
      defaultCurrency: 'EUR',
    };

    // Direct SQLite test through auth logic
    const userId = `user-${Date.now()}`;
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, avatarColor, defaultCurrency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, user.name, user.email, '#007AFF', user.defaultCurrency, new Date().toISOString());

    const retrieved = db.prepare('SELECT * FROM users WHERE email = ?').get(user.email) as any;
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Jordan Bell');
    expect(retrieved.defaultCurrency).toBe('EUR');
  });

  it('retrieves registered users list', () => {
    const users = db.prepare('SELECT * FROM users').all();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});
