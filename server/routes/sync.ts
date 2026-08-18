import { Router, Request, Response } from 'express';
import { db } from '../db';

export const syncRouter = Router();

// Full sync for a trip
syncRouter.get('/:tripId', (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    const tripRow = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    if (!tripRow) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = {
      ...tripRow,
      archived: Boolean(tripRow.archived),
      members: JSON.parse(tripRow.membersJson),
    };

    const expenseRows = db
      .prepare('SELECT * FROM expenses WHERE tripId = ? ORDER BY date DESC, createdAt DESC')
      .all(tripId) as any[];

    const expenses = expenseRows.map((r) => ({
      ...r,
      paidBy: JSON.parse(r.paidByJson),
      splitWithMemberIds: JSON.parse(r.splitWithMemberIdsJson),
      customSplits: r.customSplitsJson ? JSON.parse(r.customSplitsJson) : undefined,
      itemizedItems: r.itemizedItemsJson ? JSON.parse(r.itemizedItemsJson) : undefined,
    }));

    const settlements = db
      .prepare('SELECT * FROM settlements WHERE tripId = ? ORDER BY date DESC, createdAt DESC')
      .all(tripId);

    const auditLogs = db
      .prepare('SELECT * FROM audit_logs WHERE tripId = ? ORDER BY timestamp DESC LIMIT 50')
      .all(tripId);

    res.json({
      trip,
      expenses,
      settlements,
      auditLogs,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
