import { Router, Request, Response } from 'express';
import { db } from '../db';

export const authRouter = Router();

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];

// Get all users (for persona switcher & member lookup)
authRouter.get('/users', (_req: Request, res: Response) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY createdAt ASC').all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by ID
authRouter.get('/user/:id', (req: Request, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register new user
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, avatarColor, defaultCurrency } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
    if (existing) {
      return res.status(200).json({
        message: 'User already exists, logged in successfully',
        user: existing,
        token: `session-${existing.id}-${Date.now()}`,
      });
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const randomColor = avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const currency = defaultCurrency || 'USD';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, avatarColor, defaultCurrency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), normalizedEmail, randomColor, currency, now);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token: `session-${userId}-${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login user with email
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;

    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' });
    }

    res.json({
      message: 'Login successful',
      user,
      token: `session-${user.id}-${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
authRouter.put('/profile/:id', (req: Request, res: Response) => {
  try {
    const { name, avatarColor, defaultCurrency } = req.body;

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        avatarColor = COALESCE(?, avatarColor),
        defaultCurrency = COALESCE(?, defaultCurrency)
      WHERE id = ?
    `).run(name, avatarColor, defaultCurrency, req.params.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
