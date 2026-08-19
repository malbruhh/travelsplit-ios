import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../utils/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

export const authRouter = Router();

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];

// Get all users (for persona switcher & member lookup)
authRouter.get('/users', (_req: Request, res: Response) => {
  try {
    const users = db
      .prepare('SELECT id, name, email, avatarColor, defaultCurrency, createdAt FROM users ORDER BY createdAt ASC')
      .all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get authenticated user profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db
      .prepare('SELECT id, name, email, avatarColor, defaultCurrency, createdAt FROM users WHERE id = ?')
      .get(req.user?.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by ID
authRouter.get('/user/:id', (req: Request, res: Response) => {
  try {
    const user = db
      .prepare('SELECT id, name, email, avatarColor, defaultCurrency, createdAt FROM users WHERE id = ?')
      .get(req.params.id as string);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register new user with password hashing & dual-token issuance
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, avatarColor, defaultCurrency } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
    if (existing) {
      // If password provided, verify it
      if (password && existing.passwordHash) {
        const isMatch = bcrypt.compareSync(password, existing.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid password for existing account' });
        }
      }

      const tokenPayload = { userId: existing.id, email: existing.email, name: existing.name };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const { passwordHash: _, ...safeUser } = existing;
      return res.status(200).json({
        message: 'Account already exists, logged in successfully',
        user: safeUser,
        accessToken,
        refreshToken,
      });
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const randomColor = avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const currency = defaultCurrency || 'USD';
    const now = new Date().toISOString();

    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, avatarColor, defaultCurrency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), normalizedEmail, passwordHash, randomColor, currency, now);

    const safeUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      avatarColor: randomColor,
      defaultCurrency: currency,
      createdAt: now,
    };

    const tokenPayload = { userId, email: normalizedEmail, name: name.trim() };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      message: 'User registered successfully',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login user with password verification & dual-token issuance
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;

    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' });
    }

    // Verify password if one was set on the account
    if (user.passwordHash && password) {
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const tokenPayload = { userId: user.id, email: user.email, name: user.name };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rotate Tokens (Dual-Token System Endpoint)
authRouter.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Revoke old refresh token (Token Rotation)
    revokeRefreshToken(refreshToken);

    // Issue fresh new token pair
    const tokenPayload = { userId: payload.userId, email: payload.email, name: payload.name };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout & Revoke Refresh Token
authRouter.post('/logout', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
authRouter.put('/profile/:id', (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { name, avatarColor, defaultCurrency, password } = req.body;

    let passwordHash = undefined;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
      revokeAllUserTokens(userId); // Invalidate active sessions on password change
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        avatarColor = COALESCE(?, avatarColor),
        defaultCurrency = COALESCE(?, defaultCurrency),
        passwordHash = COALESCE(?, passwordHash)
      WHERE id = ?
    `).run(name, avatarColor, defaultCurrency, passwordHash || null, userId);

    const updated = db
      .prepare('SELECT id, name, email, avatarColor, defaultCurrency, createdAt FROM users WHERE id = ?')
      .get(userId);

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
