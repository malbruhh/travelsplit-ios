import { create } from 'zustand';
import type { Trip, TripMember, TripRole } from '../types';
import { tripRepository } from '../db/repositories/tripRepository';
import { auditRepository } from '../db/repositories/auditRepository';
import { useAuthStore } from './useAuthStore';
import { initializeDatabaseSeed } from '../db/seed';
import { syncService } from '../services/syncService';
import { api } from '../services/api';

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;

  // Actions
  initializeTrips: () => Promise<void>;
  selectTrip: (tripId: string) => Promise<void>;
  createTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  addMember: (tripId: string, member: TripMember) => Promise<void>;
  updateMemberRole: (tripId: string, userId: string, role: TripRole) => Promise<void>;
  removeMember: (tripId: string, userId: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  resetToSeedData: () => Promise<void>;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  isLoading: true,

  initializeTrips: async () => {
    set({ isLoading: true });
    await initializeDatabaseSeed(false);
    
    // Try to sync with server if online
    try {
      if (await api.isServerOnline()) {
        const remoteTrips = await api.getTrips();
        if (remoteTrips.length > 0) {
          for (const rTrip of remoteTrips) {
            await tripRepository.create(rTrip);
          }
        }
      }
    } catch {
      // offline fallback
    }

    const trips = await tripRepository.getAll();
    const active = trips.length > 0 ? (get().activeTrip || trips[0]) : null;
    
    if (active) {
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser) {
        const member = active.members.find(m => m.userId === currentUser.id);
        useAuthStore.getState().setActiveRole(member ? member.role : 'viewer');
      }
    }

    set({ trips, activeTrip: active, isLoading: false });
  },

  selectTrip: async (tripId: string) => {
    // Try remote sync first
    await syncService.syncTripFromRemote(tripId);
    
    const trip = await tripRepository.getById(tripId);
    if (trip) {
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser) {
        const member = trip.members.find(m => m.userId === currentUser.id);
        useAuthStore.getState().setActiveRole(member ? member.role : 'viewer');
      }
      set({ activeTrip: trip });
    }
  },

  createTrip: async (tripData) => {
    const currentUser = useAuthStore.getState().currentUser;
    const now = new Date().toISOString();
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      joinCode: tripData.joinCode || generateRandomCode(),
      createdAt: now,
      updatedAt: now,
    };

    await tripRepository.create(newTrip);
    await syncService.pushTrip(newTrip);

    if (currentUser) {
      await auditRepository.log(
        newTrip.id,
        currentUser.id,
        currentUser.name,
        'UPDATE_TRIP',
        `Created trip "${newTrip.name}" (Code: ${newTrip.joinCode})`
      );
    }

    const trips = await tripRepository.getAll();
    set({ trips, activeTrip: newTrip });
    return newTrip;
  },

  updateTrip: async (tripId: string, updates: Partial<Trip>) => {
    await tripRepository.update(tripId, updates);
    try {
      if (await api.isServerOnline()) {
        await api.updateTrip(tripId, updates);
      }
    } catch {}

    const updated = await tripRepository.getById(tripId);
    const trips = await tripRepository.getAll();
    if (updated) {
      set({ trips, activeTrip: get().activeTrip?.id === tripId ? updated : get().activeTrip });
    }
  },

  addMember: async (tripId: string, member: TripMember) => {
    const currentUser = useAuthStore.getState().currentUser;
    await tripRepository.addMember(tripId, member);
    const updated = await tripRepository.getById(tripId);
    if (updated) {
      try {
        if (await api.isServerOnline()) {
          await api.updateTrip(tripId, { members: updated.members });
        }
      } catch {}
    }

    const trips = await tripRepository.getAll();

    if (currentUser) {
      await auditRepository.log(
        tripId,
        currentUser.id,
        currentUser.name,
        'ADD_MEMBER',
        `Added member ${member.name} as ${member.role}`
      );
    }

    if (updated) {
      set({ trips, activeTrip: updated });
    }
  },

  updateMemberRole: async (tripId: string, userId: string, role: TripRole) => {
    const currentUser = useAuthStore.getState().currentUser;
    await tripRepository.updateMemberRole(tripId, userId, role);
    const updated = await tripRepository.getById(tripId);
    if (updated) {
      try {
        if (await api.isServerOnline()) {
          await api.updateTrip(tripId, { members: updated.members });
        }
      } catch {}
    }

    const trips = await tripRepository.getAll();

    if (currentUser) {
      await auditRepository.log(
        tripId,
        currentUser.id,
        currentUser.name,
        'UPDATE_ROLE',
        `Updated role of ${userId} to ${role}`
      );
    }

    if (updated) {
      if (currentUser?.id === userId) {
        useAuthStore.getState().setActiveRole(role);
      }
      set({ trips, activeTrip: updated });
    }
  },

  removeMember: async (tripId: string, userId: string) => {
    await tripRepository.removeMember(tripId, userId);
    const updated = await tripRepository.getById(tripId);
    if (updated) {
      try {
        if (await api.isServerOnline()) {
          await api.updateTrip(tripId, { members: updated.members });
        }
      } catch {}
    }

    const trips = await tripRepository.getAll();
    if (updated) {
      set({ trips, activeTrip: updated });
    }
  },

  deleteTrip: async (tripId: string) => {
    await tripRepository.delete(tripId);
    try {
      if (await api.isServerOnline()) {
        await api.deleteTrip(tripId);
      }
    } catch {}

    const trips = await tripRepository.getAll();
    const active = trips.length > 0 ? trips[0] : null;
    set({ trips, activeTrip: active });
  },

  resetToSeedData: async () => {
    await initializeDatabaseSeed(true);
    await get().initializeTrips();
  }
}));
