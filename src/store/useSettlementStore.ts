import { create } from 'zustand';
import type { Settlement } from '../types';
import { settlementRepository } from '../db/repositories/settlementRepository';
import { auditRepository } from '../db/repositories/auditRepository';
import { useAuthStore } from './useAuthStore';
import { syncService } from '../services/syncService';
import { api } from '../services/api';
import { triggerHaptic } from '../lib/utils';
import confetti from 'canvas-confetti';

interface SettlementState {
  settlements: Settlement[];
  isLoading: boolean;

  loadSettlements: (tripId: string) => Promise<void>;
  recordSettlement: (settleData: Omit<Settlement, 'id' | 'createdAt'>) => Promise<Settlement>;
  deleteSettlement: (id: string, tripId: string) => Promise<void>;
}

export const useSettlementStore = create<SettlementState>((set) => ({
  settlements: [],
  isLoading: false,

  loadSettlements: async (tripId: string) => {
    set({ isLoading: true });
    const local = await settlementRepository.getByTripId(tripId);
    set({ settlements: local, isLoading: false });

    try {
      if (await api.isServerOnline()) {
        const remote = await api.getSettlements(tripId);
        if (remote && remote.length > 0) {
          for (const s of remote) {
            await settlementRepository.create(s);
          }
          const updated = await settlementRepository.getByTripId(tripId);
          set({ settlements: updated });
        }
      }
    } catch {}
  },

  recordSettlement: async (settleData) => {
    const currentUser = useAuthStore.getState().currentUser;
    const newSettlement: Settlement = {
      ...settleData,
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    await settlementRepository.create(newSettlement);
    await syncService.pushSettlement(newSettlement);
    triggerHaptic('success');

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#007AFF', '#34C759', '#FF9500', '#AF52DE']
      });
    } catch {}

    if (currentUser) {
      await auditRepository.log(
        newSettlement.tripId,
        currentUser.id,
        currentUser.name,
        'RECORD_SETTLEMENT',
        `Recorded settlement of $${newSettlement.amount.toFixed(2)} via ${newSettlement.paymentMethod}`
      );
    }

    const settlements = await settlementRepository.getByTripId(newSettlement.tripId);
    set({ settlements });
    return newSettlement;
  },

  deleteSettlement: async (id: string, tripId: string) => {
    await settlementRepository.delete(id);
    try {
      if (await api.isServerOnline()) {
        await api.deleteSettlement(id);
      }
    } catch {}

    triggerHaptic('warning');
    const settlements = await settlementRepository.getByTripId(tripId);
    set({ settlements });
  }
}));
