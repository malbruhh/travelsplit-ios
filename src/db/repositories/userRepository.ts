import { db } from '../db';
import type { User } from '../../types';

export const userRepository = {
  async getAll(): Promise<User[]> {
    return await db.users.toArray();
  },

  async getById(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  },

  async getByEmail(email: string): Promise<User | undefined> {
    return await db.users.where('email').equalsIgnoreCase(email).first();
  },

  async create(user: User): Promise<string> {
    return await db.users.put(user);
  },

  async update(id: string, updates: Partial<User>): Promise<number> {
    return await db.users.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.users.delete(id);
  }
};
