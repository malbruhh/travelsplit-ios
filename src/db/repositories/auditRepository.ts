import { db } from '../db';
import type { AuditLog } from '../../types';

export const auditRepository = {
  async getByTripId(tripId: string): Promise<AuditLog[]> {
    return await db.auditLogs.where('tripId').equals(tripId).reverse().sortBy('timestamp');
  },

  async log(tripId: string, userId: string, userName: string, action: AuditLog['action'], details: string): Promise<string> {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tripId,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    return await db.auditLogs.put(entry);
  }
};
