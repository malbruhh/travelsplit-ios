import { Router, Request, Response } from 'express';
import { db } from '../db';

export const expensesRouter = Router();

// Get expenses for a trip
expensesRouter.get('/trip/:tripId', (req: Request, res: Response) => {
  try {
    const rows = db
      .prepare('SELECT * FROM expenses WHERE tripId = ? ORDER BY date DESC, createdAt DESC')
      .all(req.params.tripId) as any[];

    const expenses = rows.map((r) => ({
      ...r,
      paidBy: JSON.parse(r.paidByJson),
      splitWithMemberIds: JSON.parse(r.splitWithMemberIdsJson),
      customSplits: r.customSplitsJson ? JSON.parse(r.customSplitsJson) : undefined,
      itemizedItems: r.itemizedItemsJson ? JSON.parse(r.itemizedItemsJson) : undefined,
    }));

    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
expensesRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      id,
      tripId,
      title,
      category,
      amount,
      currency,
      exchangeRate,
      date,
      paidBy,
      splitType,
      splitWithMemberIds,
      customSplits,
      itemizedItems,
      taxAmount,
      tipAmount,
      notes,
      createdBy,
    } = req.body;

    const now = new Date().toISOString();
    const expId = id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    db.prepare(`
      INSERT INTO expenses (
        id, tripId, title, category, amount, currency, exchangeRate, date,
        paidByJson, splitType, splitWithMemberIdsJson, customSplitsJson, itemizedItemsJson,
        taxAmount, tipAmount, notes, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expId,
      tripId,
      title,
      category,
      amount,
      currency,
      exchangeRate || 1,
      date,
      JSON.stringify(paidBy || []),
      splitType,
      JSON.stringify(splitWithMemberIds || []),
      customSplits ? JSON.stringify(customSplits) : null,
      itemizedItems ? JSON.stringify(itemizedItems) : null,
      taxAmount || 0,
      tipAmount || 0,
      notes || null,
      createdBy,
      now,
      now
    );

    const r = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expId) as any;
    res.status(201).json({
      ...r,
      paidBy: JSON.parse(r.paidByJson),
      splitWithMemberIds: JSON.parse(r.splitWithMemberIdsJson),
      customSplits: r.customSplitsJson ? JSON.parse(r.customSplitsJson) : undefined,
      itemizedItems: r.itemizedItemsJson ? JSON.parse(r.itemizedItemsJson) : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense
expensesRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      amount,
      currency,
      exchangeRate,
      date,
      paidBy,
      splitType,
      splitWithMemberIds,
      customSplits,
      itemizedItems,
      taxAmount,
      tipAmount,
      notes,
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE expenses SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        amount = COALESCE(?, amount),
        currency = COALESCE(?, currency),
        exchangeRate = COALESCE(?, exchangeRate),
        date = COALESCE(?, date),
        paidByJson = COALESCE(?, paidByJson),
        splitType = COALESCE(?, splitType),
        splitWithMemberIdsJson = COALESCE(?, splitWithMemberIdsJson),
        customSplitsJson = COALESCE(?, customSplitsJson),
        itemizedItemsJson = COALESCE(?, itemizedItemsJson),
        taxAmount = COALESCE(?, taxAmount),
        tipAmount = COALESCE(?, tipAmount),
        notes = COALESCE(?, notes),
        updatedAt = ?
      WHERE id = ?
    `).run(
      title,
      category,
      amount,
      currency,
      exchangeRate,
      date,
      paidBy ? JSON.stringify(paidBy) : null,
      splitType,
      splitWithMemberIds ? JSON.stringify(splitWithMemberIds) : null,
      customSplits ? JSON.stringify(customSplits) : null,
      itemizedItems ? JSON.stringify(itemizedItems) : null,
      taxAmount,
      tipAmount,
      notes,
      now,
      req.params.id
    );

    const r = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as any;
    if (!r) return res.status(404).json({ error: 'Expense not found' });

    res.json({
      ...r,
      paidBy: JSON.parse(r.paidByJson),
      splitWithMemberIds: JSON.parse(r.splitWithMemberIdsJson),
      customSplits: r.customSplitsJson ? JSON.parse(r.customSplitsJson) : undefined,
      itemizedItems: r.itemizedItemsJson ? JSON.parse(r.itemizedItemsJson) : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
expensesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
