import Dexie, { type Table } from 'dexie';
import type { User, Trip, Expense, Settlement, AuditLog } from '../types';

export class TravelSplitDB extends Dexie {
  users!: Table<User, string>;
  trips!: Table<Trip, string>;
  expenses!: Table<Expense, string>;
  settlements!: Table<Settlement, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('TravelSplitIOS_DB');
    this.version(1).stores({
      users: 'id, email, name',
      trips: 'id, createdBy, archived, createdAt',
      expenses: 'id, tripId, category, date, splitType, createdBy',
      settlements: 'id, tripId, fromUserId, toUserId, date',
      auditLogs: 'id, tripId, userId, timestamp',
    });
  }
}

export const db = new TravelSplitDB();
