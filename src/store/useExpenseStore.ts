import { create } from 'zustand';
import type { Expense, ExpenseCategory } from '../types';
import { expenseRepository } from '../db/repositories/expenseRepository';
import { auditRepository } from '../db/repositories/auditRepository';
import { useAuthStore } from './useAuthStore';
import { syncService } from '../services/syncService';
import { api } from '../services/api';
import { triggerHaptic } from '../lib/utils';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  selectedCategory: ExpenseCategory | 'all';
  filterMemberId: string | 'all';
  searchQuery: string;

  // Actions
  loadExpenses: (tripId: string) => Promise<void>;
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string, tripId: string) => Promise<void>;
  setSelectedCategory: (cat: ExpenseCategory | 'all') => void;
  setFilterMemberId: (memberId: string | 'all') => void;
  setSearchQuery: (query: string) => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  selectedCategory: 'all',
  filterMemberId: 'all',
  searchQuery: '',

  loadExpenses: async (tripId: string) => {
    set({ isLoading: true });
    // First load from local DB for instant render
    const localExpenses = await expenseRepository.getByTripId(tripId);
    set({ expenses: localExpenses, isLoading: false });

    // Then background sync from server if online
    try {
      if (await api.isServerOnline()) {
        const remoteExpenses = await api.getExpenses(tripId);
        if (remoteExpenses && remoteExpenses.length > 0) {
          for (const exp of remoteExpenses) {
            await expenseRepository.create(exp);
          }
          const updated = await expenseRepository.getByTripId(tripId);
          set({ expenses: updated });
        }
      }
    } catch {}
  },

  addExpense: async (expenseData) => {
    const currentUser = useAuthStore.getState().currentUser;
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };

    await expenseRepository.create(newExpense);
    await syncService.pushExpense(newExpense);
    triggerHaptic('success');

    if (currentUser) {
      await auditRepository.log(
        newExpense.tripId,
        currentUser.id,
        currentUser.name,
        'CREATE_EXPENSE',
        `Added ${newExpense.category} expense "${newExpense.title}" ($${newExpense.amount.toFixed(2)} ${newExpense.currency})`
      );
    }

    const expenses = await expenseRepository.getByTripId(newExpense.tripId);
    set({ expenses });
    return newExpense;
  },

  updateExpense: async (id: string, updates: Partial<Expense>) => {
    const currentUser = useAuthStore.getState().currentUser;
    await expenseRepository.update(id, updates);
    try {
      if (await api.isServerOnline()) {
        await api.updateExpense(id, updates);
      }
    } catch {}

    triggerHaptic('light');

    const updated = await expenseRepository.getById(id);
    if (updated && currentUser) {
      await auditRepository.log(
        updated.tripId,
        currentUser.id,
        currentUser.name,
        'UPDATE_EXPENSE',
        `Updated expense "${updated.title}"`
      );
      const expenses = await expenseRepository.getByTripId(updated.tripId);
      set({ expenses });
    }
  },

  deleteExpense: async (id: string, tripId: string) => {
    const currentUser = useAuthStore.getState().currentUser;
    const exp = await expenseRepository.getById(id);
    await expenseRepository.delete(id);
    try {
      if (await api.isServerOnline()) {
        await api.deleteExpense(id);
      }
    } catch {}

    triggerHaptic('warning');

    if (exp && currentUser) {
      await auditRepository.log(
        tripId,
        currentUser.id,
        currentUser.name,
        'DELETE_EXPENSE',
        `Deleted expense "${exp.title}" ($${exp.amount.toFixed(2)})`
      );
    }

    const expenses = await expenseRepository.getByTripId(tripId);
    set({ expenses });
  },

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setFilterMemberId: (memberId) => set({ filterMemberId: memberId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
