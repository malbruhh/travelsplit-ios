import { Router, Request, Response } from 'express';
import { db } from '../db';

export const tripsRouter = Router();

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all trips
tripsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM trips ORDER BY createdAt DESC').all() as any[];
    const trips = rows.map((r) => ({
      ...r,
      archived: Boolean(r.archived),
      members: JSON.parse(r.membersJson),
    }));
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lookup trip by Join Code
tripsRouter.get('/code/:joinCode', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM trips WHERE joinCode = ?').get(req.params.joinCode.toUpperCase()) as any;
    if (!row) {
      return res.status(404).json({ error: 'Trip with this join code not found' });
    }
    const trip = {
      ...row,
      archived: Boolean(row.archived),
      members: JSON.parse(row.membersJson),
    };
    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Join Trip by Code
tripsRouter.post('/join', (req: Request, res: Response) => {
  try {
    const { joinCode, user } = req.body;
    if (!joinCode || !user) {
      return res.status(400).json({ error: 'joinCode and user are required' });
    }

    const row = db.prepare('SELECT * FROM trips WHERE joinCode = ?').get(joinCode.toUpperCase()) as any;
    if (!row) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    const members = JSON.parse(row.membersJson);
    const existingIdx = members.findIndex((m: any) => m.userId === user.id || m.email === user.email);

    if (existingIdx === -1) {
      members.push({
        userId: user.id,
        name: user.name,
        role: 'editor',
        avatarColor: user.avatarColor || '#007AFF',
        defaultWeight: 1,
        email: user.email,
      });

      const now = new Date().toISOString();
      db.prepare('UPDATE trips SET membersJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(members),
        now,
        row.id
      );

      // Audit log
      db.prepare(
        'INSERT INTO audit_logs (id, tripId, userId, userName, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        `audit-${Date.now()}`,
        row.id,
        user.id,
        user.name,
        'ADD_MEMBER',
        `${user.name} joined the trip via code ${joinCode.toUpperCase()}`,
        now
      );
    }

    const updatedRow = db.prepare('SELECT * FROM trips WHERE id = ?').get(row.id) as any;
    res.json({
      ...updatedRow,
      archived: Boolean(updatedRow.archived),
      members: JSON.parse(updatedRow.membersJson),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Trip
tripsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, name, destination, baseCurrency, startDate, endDate, createdBy, members, totalBudget, joinCode } = req.body;
    const now = new Date().toISOString();
    const tripId = id || `trip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const finalCode = (joinCode || generateJoinCode()).toUpperCase();

    db.prepare(`
      INSERT INTO trips (id, name, destination, baseCurrency, startDate, endDate, createdBy, joinCode, membersJson, archived, totalBudget, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      tripId,
      name,
      destination,
      baseCurrency || 'USD',
      startDate,
      endDate,
      createdBy,
      finalCode,
      JSON.stringify(members || []),
      totalBudget || null,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    res.status(201).json({
      ...row,
      archived: Boolean(row.archived),
      members: JSON.parse(row.membersJson),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Trip
tripsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, destination, baseCurrency, startDate, endDate, members, totalBudget, archived } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE trips SET
        name = COALESCE(?, name),
        destination = COALESCE(?, destination),
        baseCurrency = COALESCE(?, baseCurrency),
        startDate = COALESCE(?, startDate),
        endDate = COALESCE(?, endDate),
        membersJson = COALESCE(?, membersJson),
        totalBudget = COALESCE(?, totalBudget),
        archived = COALESCE(?, archived),
        updatedAt = ?
      WHERE id = ?
    `).run(
      name,
      destination,
      baseCurrency,
      startDate,
      endDate,
      members ? JSON.stringify(members) : null,
      totalBudget,
      archived !== undefined ? (archived ? 1 : 0) : null,
      now,
      req.params.id
    );

    const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: 'Trip not found' });

    res.json({
      ...row,
      archived: Boolean(row.archived),
      members: JSON.parse(row.membersJson),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Trip
tripsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM expenses WHERE tripId = ?').run(req.params.id);
    db.prepare('DELETE FROM settlements WHERE tripId = ?').run(req.params.id);
    db.prepare('DELETE FROM audit_logs WHERE tripId = ?').run(req.params.id);
    db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
