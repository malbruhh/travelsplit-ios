import type { Trip, Expense, Settlement, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async isServerOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // User Authentication
  async register(name: string, email: string, defaultCurrency: string = 'USD', avatarColor?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, defaultCurrency, avatarColor }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUserById(id: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/user/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE}/trips`);
    if (!res.ok) throw new Error('Failed to fetch trips from server');
    return res.json();
  },

  async getTripByCode(code: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/code/${code.toUpperCase()}`);
    if (!res.ok) throw new Error('Trip not found with this code');
    return res.json();
  },

  async joinTripByCode(joinCode: string, user: User): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode, user }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join trip');
    }
    return res.json();
  },

  async createTrip(trip: Partial<Trip>): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    });
    if (!res.ok) throw new Error('Failed to create trip on server');
    return res.json();
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update trip on server');
    return res.json();
  },

  async deleteTrip(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/trips/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete trip on server');
  },

  // Expenses
  async getExpenses(tripId: string): Promise<Expense[]> {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error('Failed to save expense on server');
    return res.json();
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update expense on server');
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense on server');
  },

  // Settlements
  async getSettlements(tripId: string): Promise<Settlement[]> {
    const res = await fetch(`${API_BASE}/settlements/trip/${tripId}`);
    if (!res.ok) throw new Error('Failed to fetch settlements');
    return res.json();
  },

  async createSettlement(settlement: Partial<Settlement>): Promise<Settlement> {
    const res = await fetch(`${API_BASE}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settlement),
    });
    if (!res.ok) throw new Error('Failed to record settlement on server');
    return res.json();
  },

  async deleteSettlement(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/settlements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete settlement on server');
  },

  // Full Trip Sync
  async syncTrip(tripId: string): Promise<{
    trip: Trip;
    expenses: Expense[];
    settlements: Settlement[];
    auditLogs: any[];
  }> {
    const res = await fetch(`${API_BASE}/sync/${tripId}`);
    if (!res.ok) throw new Error('Failed to sync trip data');
    return res.json();
  }
};
