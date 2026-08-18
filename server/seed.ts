import { db } from './db';
import { SEED_TRIP, SEED_EXPENSES, SEED_SETTLEMENTS, SEED_USERS, SEED_AUDIT_LOGS } from '../src/db/seed';

export function initializeServerSeed() {
  const tripCount = db.prepare('SELECT COUNT(*) as count FROM trips').get() as { count: number };
  if (tripCount.count === 0) {
    console.log('🌱 Seeding initial database with "Japan Sakura Expedition"...');

    // Users
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, avatarColor, defaultCurrency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    SEED_USERS.forEach((u) => {
      insertUser.run(u.id, u.name, u.email, u.avatarColor, u.defaultCurrency, u.createdAt);
    });

    // Trip
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO trips (id, name, destination, baseCurrency, startDate, endDate, createdBy, joinCode, membersJson, archived, totalBudget, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      SEED_TRIP.id,
      SEED_TRIP.name,
      SEED_TRIP.destination,
      SEED_TRIP.baseCurrency,
      SEED_TRIP.startDate,
      SEED_TRIP.endDate,
      SEED_TRIP.createdBy,
      'SAKURA', // Demo 6-char Join Code!
      JSON.stringify(SEED_TRIP.members),
      SEED_TRIP.totalBudget || null,
      now,
      now
    );

    // Expenses
    const insertExp = db.prepare(`
      INSERT OR REPLACE INTO expenses (
        id, tripId, title, category, amount, currency, exchangeRate, date,
        paidByJson, splitType, splitWithMemberIdsJson, customSplitsJson, itemizedItemsJson,
        taxAmount, tipAmount, notes, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    SEED_EXPENSES.forEach((e) => {
      insertExp.run(
        e.id,
        e.tripId,
        e.title,
        e.category,
        e.amount,
        e.currency,
        e.exchangeRate,
        e.date,
        JSON.stringify(e.paidBy),
        e.splitType,
        JSON.stringify(e.splitWithMemberIds),
        e.customSplits ? JSON.stringify(e.customSplits) : null,
        e.itemizedItems ? JSON.stringify(e.itemizedItems) : null,
        e.taxAmount || 0,
        e.tipAmount || 0,
        e.notes || null,
        e.createdBy,
        e.createdAt,
        e.updatedAt
      );
    });

    // Settlements
    const insertSettle = db.prepare(`
      INSERT OR REPLACE INTO settlements (id, tripId, fromUserId, toUserId, amount, currency, date, notes, paymentMethod, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    SEED_SETTLEMENTS.forEach((s) => {
      insertSettle.run(
        s.id,
        s.tripId,
        s.fromUserId,
        s.toUserId,
        s.amount,
        s.currency,
        s.date,
        s.notes || null,
        s.paymentMethod,
        s.createdAt
      );
    });

    // Audit logs
    const insertAudit = db.prepare(`
      INSERT OR REPLACE INTO audit_logs (id, tripId, userId, userName, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    SEED_AUDIT_LOGS.forEach((a) => {
      insertAudit.run(a.id, a.tripId, a.userId, a.userName, a.action, a.details, a.timestamp);
    });

    console.log('✅ Database seeded with Join Code: SAKURA');
  }
}
