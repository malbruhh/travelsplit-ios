import { db } from '../db';
import type { Settlement } from '../../types';

export const settlementRepository = {
  async getByTripId(tripId: string): Promise<Settlement[]> {
    return await db.settlements.where('tripId').equals(tripId).reverse().sortBy('date');
  },

  async getById(id: string): Promise<Settlement | undefined> {
    return await db.settlements.get(id);
  },

  async create(settlement: Settlement): Promise<string> {
    return await db.settlements.put(settlement);
  },

  async delete(id: string): Promise<void> {
    await db.settlements.delete(id);
  }
};
