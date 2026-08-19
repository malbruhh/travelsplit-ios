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
  sessionToken: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string) => Promise<boolean>;
  register: (name: string, email: string, defaultCurrency?: string) => Promise<User>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  setActiveRole: (role: TripRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      activeRole: 'owner',
      allUsers: [],
      sessionToken: null,

      initializeAuth: async () => {
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

      login: async (email: string) => {
        try {
          if (await api.isServerOnline()) {
            const res = await api.login(email);
            await userRepository.create(res.user);
            set({ currentUser: res.user, isAuthenticated: true, sessionToken: res.token });
            return true;
          }
        } catch {}

        const user = await userRepository.getByEmail(email);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (name: string, email: string, defaultCurrency: string = 'USD') => {
        const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        try {
          if (await api.isServerOnline()) {
            const res = await api.register(name, email, defaultCurrency, randomColor);
            await userRepository.create(res.user);
            const users = await userRepository.getAll();
            set({ currentUser: res.user, isAuthenticated: true, allUsers: users, sessionToken: res.token });
            return res.user;
          }
        } catch {}

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

      logout: () => {
        set({ currentUser: null, isAuthenticated: false, activeRole: 'viewer', sessionToken: null });
      },

      switchUser: async (userId: string) => {
        const user = (await userRepository.getById(userId)) || get().allUsers.find(u => u.id === userId);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
        }
      },

      setActiveRole: (role: TripRole) => {
        set({ activeRole: role });
      }
    }),
    {
      name: 'travelsplit-auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser, isAuthenticated: state.isAuthenticated, sessionToken: state.sessionToken }),
    }
  )
);
