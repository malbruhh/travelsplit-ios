import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TripRole } from '../types';
import { userRepository } from '../db/repositories/userRepository';
import { SEED_USERS } from '../db/seed';
import { api } from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: TripRole;
  allUsers: User[];
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string, defaultCurrency?: string) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  setActiveRole: (role: TripRole) => void;
  updateProfile: (updates: Partial<User> & { password?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      activeRole: 'owner',
      allUsers: [],
      accessToken: null,
      refreshToken: null,

      initializeAuth: async () => {
        // Sync tokens to API client
        const storedAccess = get().accessToken;
        const storedRefresh = get().refreshToken;
        if (storedAccess || storedRefresh) {
          api.setTokens(storedAccess, storedRefresh);
        }

        // Fetch remote users if online
        try {
          if (await api.isServerOnline()) {
            const remoteUsers = await api.getUsers();
            if (remoteUsers.length > 0) {
              for (const u of remoteUsers) {
                await userRepository.create(u);
              }
            }
          }
        } catch {}

        const users = await userRepository.getAll();
        const availableUsers = users.length > 0 ? users : SEED_USERS;
        set({ allUsers: availableUsers });

        if (!get().currentUser && availableUsers.length > 0) {
          // Default to Alex Rivera (Trip Owner)
          const defaultUser = availableUsers[0];
          set({
            currentUser: defaultUser,
            isAuthenticated: true,
            activeRole: 'owner',
          });
        }
      },

      login: async (email: string, password?: string) => {
        try {
          if (await api.isServerOnline()) {
            const res = await api.login(email, password);
            await userRepository.create(res.user);
            set({
              currentUser: res.user,
              isAuthenticated: true,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
            });
            return true;
          }
        } catch (err) {
          console.warn('Backend login failed, falling back to local:', err);
        }

        const user = await userRepository.getByEmail(email);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (name: string, email: string, password?: string, defaultCurrency: string = 'USD') => {
        const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        try {
          if (await api.isServerOnline()) {
            const res = await api.register(name, email, password, defaultCurrency, randomColor);
            await userRepository.create(res.user);
            const users = await userRepository.getAll();
            set({
              currentUser: res.user,
              isAuthenticated: true,
              allUsers: users,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
            });
            return res.user;
          }
        } catch (err) {
          console.warn('Backend register failed, falling back to local:', err);
        }

        const existing = await userRepository.getByEmail(email);
        if (existing) {
          set({ currentUser: existing, isAuthenticated: true });
          return existing;
        }

        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          email,
          avatarColor: randomColor,
          defaultCurrency,
          createdAt: new Date().toISOString(),
        };

        await userRepository.create(newUser);
        const users = await userRepository.getAll();
        set({ currentUser: newUser, isAuthenticated: true, allUsers: users });
        return newUser;
      },

      logout: async () => {
        await api.logout();
        set({
          currentUser: null,
          isAuthenticated: false,
          activeRole: 'viewer',
          accessToken: null,
          refreshToken: null,
        });
      },

      switchUser: async (userId: string) => {
        const user = (await userRepository.getById(userId)) || get().allUsers.find((u) => u.id === userId);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
        }
      },

      setActiveRole: (role: TripRole) => {
        set({ activeRole: role });
      },

      updateProfile: async (updates) => {
        const current = get().currentUser;
        if (!current) return;

        const updated: User = {
          ...current,
          name: updates.name || current.name,
          avatarColor: updates.avatarColor || current.avatarColor,
          defaultCurrency: updates.defaultCurrency || current.defaultCurrency,
        };

        await userRepository.update(current.id, updated);

        try {
          if (await api.isServerOnline()) {
            await api.updateProfile(current.id, updates);
          }
        } catch {}

        set({ currentUser: updated });
      },
    }),
    {
      name: 'travelsplit-auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
