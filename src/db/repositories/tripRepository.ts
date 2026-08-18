import { db } from '../db';
import type { Trip, TripMember } from '../../types';

export const tripRepository = {
  async getAll(): Promise<Trip[]> {
    return await db.trips.reverse().sortBy('createdAt');
  },

  async getById(id: string): Promise<Trip | undefined> {
    return await db.trips.get(id);
  },

  async create(trip: Trip): Promise<string> {
    return await db.trips.put(trip);
  },

  async update(id: string, updates: Partial<Trip>): Promise<number> {
    return await db.trips.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async addMember(tripId: string, member: TripMember): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) throw new Error('Trip not found');
    const members = trip.members.filter(m => m.userId !== member.userId);
    members.push(member);
    await db.trips.update(tripId, { members, updatedAt: new Date().toISOString() });
  },

  async updateMemberRole(tripId: string, userId: string, newRole: TripMember['role']): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) throw new Error('Trip not found');
    const members = trip.members.map(m => m.userId === userId ? { ...m, role: newRole } : m);
    await db.trips.update(tripId, { members, updatedAt: new Date().toISOString() });
  },

  async removeMember(tripId: string, userId: string): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) throw new Error('Trip not found');
    const members = trip.members.filter(m => m.userId !== userId);
    await db.trips.update(tripId, { members, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.trips, db.expenses, db.settlements, db.auditLogs], async () => {
      await db.expenses.where('tripId').equals(id).delete();
      await db.settlements.where('tripId').equals(id).delete();
      await db.auditLogs.where('tripId').equals(id).delete();
      await db.trips.delete(id);
    });
  }
};
