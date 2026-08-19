import type { Trip, Expense, Settlement, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

// Initialize tokens from localStorage
try {
  memoryAccessToken = localStorage.getItem('travelsplit_access_token');
  memoryRefreshToken = localStorage.getItem('travelsplit_refresh_token');
} catch {}

export const api = {
  setTokens(accessToken: string | null, refreshToken: string | null) {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    try {
      if (accessToken) localStorage.setItem('travelsplit_access_token', accessToken);
      else localStorage.removeItem('travelsplit_access_token');

      if (refreshToken) localStorage.setItem('travelsplit_refresh_token', refreshToken);
      else localStorage.removeItem('travelsplit_refresh_token');
    } catch {}
  },

  getAccessToken(): string | null {
    return memoryAccessToken;
  },

  getRefreshToken(): string | null {
    return memoryRefreshToken;
  },

  /**
   * Enhanced fetch client with automatic JWT token attachment and 401 refresh interceptor
   */
  async authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (memoryAccessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${memoryAccessToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized -> Attempt token rotation
    if (response.status === 401 && memoryRefreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: memoryRefreshToken }),
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          api.setTokens(tokens.accessToken, tokens.refreshToken);

          // Retry original request with newly issued access token
          headers.set('Authorization', `Bearer ${tokens.accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Token expired completely -> Clear session
          api.setTokens(null, null);
        }
      } catch {
        api.setTokens(null, null);
      }
    }

    return response;
  },

  async isServerOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // User Authentication
  async register(
    name: string,
    email: string,
    password?: string,
    defaultCurrency: string = 'USD',
    avatarColor?: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, defaultCurrency, avatarColor }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    const data = await res.json();
    api.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async login(email: string, password?: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    const data = await res.json();
    api.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      if (memoryRefreshToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: memoryRefreshToken }),
        });
      }
    } finally {
      api.setTokens(null, null);
    }
  },

  async getMe(): Promise<User> {
    const res = await api.authFetch('/auth/me');
    if (!res.ok) throw new Error('Failed to fetch profile');
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

  async updateProfile(id: string, updates: Partial<User> & { password?: string }): Promise<User> {
    const res = await api.authFetch(`/auth/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    const res = await api.authFetch('/trips');
    if (!res.ok) throw new Error('Failed to fetch trips from server');
    return res.json();
  },

  async getTripByCode(code: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/trips/code/${code.toUpperCase()}`);
    if (!res.ok) throw new Error('Trip not found with this code');
    return res.json();
  },

  async joinTripByCode(joinCode: string, user: User): Promise<Trip> {
    const res = await api.authFetch('/trips/join', {
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
    const res = await api.authFetch('/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    });
    if (!res.ok) throw new Error('Failed to create trip on server');
    return res.json();
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const res = await api.authFetch(`/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update trip on server');
    return res.json();
  },

  async deleteTrip(id: string): Promise<void> {
    const res = await api.authFetch(`/trips/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete trip on server');
  },

  // Expenses
  async getExpenses(tripId: string): Promise<Expense[]> {
    const res = await api.authFetch(`/expenses/trip/${tripId}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const res = await api.authFetch('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error('Failed to save expense on server');
    return res.json();
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const res = await api.authFetch(`/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update expense on server');
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await api.authFetch(`/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense on server');
  },

  // Settlements
  async getSettlements(tripId: string): Promise<Settlement[]> {
    const res = await api.authFetch(`/settlements/trip/${tripId}`);
    if (!res.ok) throw new Error('Failed to fetch settlements');
    return res.json();
  },

  async createSettlement(settlement: Partial<Settlement>): Promise<Settlement> {
    const res = await api.authFetch('/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settlement),
    });
    if (!res.ok) throw new Error('Failed to record settlement on server');
    return res.json();
  },

  async deleteSettlement(id: string): Promise<void> {
    const res = await api.authFetch(`/settlements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete settlement on server');
  },

  // Full Trip Sync
  async syncTrip(tripId: string): Promise<{
    trip: Trip;
    expenses: Expense[];
    settlements: Settlement[];
    auditLogs: any[];
  }> {
    const res = await api.authFetch(`/sync/${tripId}`);
    if (!res.ok) throw new Error('Failed to sync trip data');
    return res.json();
  }
};
