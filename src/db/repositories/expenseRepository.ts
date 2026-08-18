import { db } from '../db';
import type { Expense } from '../../types';

export const expenseRepository = {
  async getByTripId(tripId: string): Promise<Expense[]> {
    return await db.expenses.where('tripId').equals(tripId).reverse().sortBy('date');
  },

  async getById(id: string): Promise<Expense | undefined> {
    return await db.expenses.get(id);
  },

  async create(expense: Expense): Promise<string> {
    return await db.expenses.put(expense);
  },

  async update(id: string, updates: Partial<Expense>): Promise<number> {
    return await db.expenses.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.expenses.delete(id);
  },

  async deleteByTripId(tripId: string): Promise<void> {
    await db.expenses.where('tripId').equals(tripId).delete();
  }
};
