import { api } from './api';
import { db } from '../db/db';
import type { Trip, Expense, Settlement } from '../types';

export const syncService = {
  /**
   * Syncs active trip from backend into local IndexedDB
   */
  async syncTripFromRemote(tripId: string): Promise<{
    synced: boolean;
    trip?: Trip;
    expenses?: Expense[];
    settlements?: Settlement[];
  }> {
    try {
      const isOnline = await api.isServerOnline();
      if (!isOnline) {
        return { synced: false };
      }

      const remoteData = await api.syncTrip(tripId);

      // Hydrate local IndexedDB
      await db.transaction('rw', [db.trips, db.expenses, db.settlements, db.auditLogs], async () => {
        await db.trips.put(remoteData.trip);
        if (remoteData.expenses.length > 0) {
          await db.expenses.where('tripId').equals(tripId).delete();
          await db.expenses.bulkPut(remoteData.expenses);
        }
        if (remoteData.settlements.length > 0) {
          await db.settlements.where('tripId').equals(tripId).delete();
          await db.settlements.bulkPut(remoteData.settlements);
        }
        if (remoteData.auditLogs && remoteData.auditLogs.length > 0) {
          await db.auditLogs.bulkPut(remoteData.auditLogs);
        }
      });

      return {
        synced: true,
        trip: remoteData.trip,
        expenses: remoteData.expenses,
        settlements: remoteData.settlements,
      };
    } catch (err) {
      console.warn('Sync failed, continuing with local storage:', err);
      return { synced: false };
    }
  },

  /**
   * Pushes a newly created trip to backend
   */
  async pushTrip(trip: Trip): Promise<void> {
    try {
      if (await api.isServerOnline()) {
        await api.createTrip(trip);
      }
    } catch (err) {
      console.warn('Remote trip push failed:', err);
    }
  },

  /**
   * Pushes a new or updated expense to backend
   */
  async pushExpense(expense: Expense): Promise<void> {
    try {
      if (await api.isServerOnline()) {
        await api.createExpense(expense);
      }
    } catch (err) {
      console.warn('Remote expense push failed:', err);
    }
  },

  /**
   * Pushes a settlement to backend
   */
  async pushSettlement(settlement: Settlement): Promise<void> {
    try {
      if (await api.isServerOnline()) {
        await api.createSettlement(settlement);
      }
    } catch (err) {
      console.warn('Remote settlement push failed:', err);
    }
  }
};
