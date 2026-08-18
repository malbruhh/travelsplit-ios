import { Router, Request, Response } from 'express';
import { db } from '../db';

export const settlementsRouter = Router();

// Get settlements for a trip
settlementsRouter.get('/trip/:tripId', (req: Request, res: Response) => {
  try {
    const rows = db
      .prepare('SELECT * FROM settlements WHERE tripId = ? ORDER BY date DESC, createdAt DESC')
      .all(req.params.tripId);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create settlement
settlementsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, tripId, fromUserId, toUserId, amount, currency, date, notes, paymentMethod } = req.body;
    const now = new Date().toISOString();
    const settleId = id || `settle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    db.prepare(`
      INSERT INTO settlements (id, tripId, fromUserId, toUserId, amount, currency, date, notes, paymentMethod, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      settleId,
      tripId,
      fromUserId,
      toUserId,
      amount,
      currency,
      date,
      notes || null,
      paymentMethod || 'venmo',
      now
    );

    const r = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settleId);
    res.status(201).json(r);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete settlement
settlementsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM settlements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
