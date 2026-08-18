import { db } from './db';
import type { User, Trip, Expense, Settlement, AuditLog } from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'user-alex',
    email: 'alex@travelsplit.app',
    name: 'Alex Rivera',
    avatarColor: '#007AFF', // iOS Blue
    defaultCurrency: 'USD',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'user-brenda',
    email: 'brenda@travelsplit.app',
    name: 'Brenda Chen',
    avatarColor: '#34C759', // iOS Green
    defaultCurrency: 'USD',
    createdAt: '2026-08-01T08:30:00.000Z',
  },
  {
    id: 'user-carlos',
    email: 'carlos@travelsplit.app',
    name: 'Carlos Gomez',
    avatarColor: '#FF9500', // iOS Orange
    defaultCurrency: 'USD',
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'user-diana',
    email: 'diana@travelsplit.app',
    name: 'Diana Prince',
    avatarColor: '#AF52DE', // iOS Purple
    defaultCurrency: 'USD',
    createdAt: '2026-08-01T09:30:00.000Z',
  },
];

export const SEED_TRIP: Trip = {
  id: 'trip-japan-2026',
  name: 'Japan Sakura Expedition 🌸',
  destination: 'Tokyo & Kyoto, Japan',
  baseCurrency: 'USD',
  startDate: '2026-08-10',
  endDate: '2026-08-22',
  createdBy: 'user-alex',
  totalBudget: 4500,
  archived: false,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-16T18:00:00.000Z',
  members: [
    {
      userId: 'user-alex',
      name: 'Alex Rivera',
      role: 'owner',
      avatarColor: '#007AFF',
      defaultWeight: 1,
      email: 'alex@travelsplit.app',
    },
    {
      userId: 'user-brenda',
      name: 'Brenda Chen',
      role: 'editor',
      avatarColor: '#34C759',
      defaultWeight: 1,
      email: 'brenda@travelsplit.app',
    },
    {
      userId: 'user-carlos',
      name: 'Carlos Gomez',
      role: 'editor',
      avatarColor: '#FF9500',
      defaultWeight: 1,
      email: 'carlos@travelsplit.app',
    },
    {
      userId: 'user-diana',
      name: 'Diana Prince',
      role: 'viewer',
      avatarColor: '#AF52DE',
      defaultWeight: 1,
      email: 'diana@travelsplit.app',
    },
  ],
};

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-shinkansen',
    tripId: 'trip-japan-2026',
    title: 'Shinkansen Bullet Train Passes (Tokyo-Kyoto)',
    category: 'transport',
    amount: 520,
    currency: 'USD',
    exchangeRate: 1,
    date: '2026-08-10',
    paidBy: [{ userId: 'user-alex', amount: 520 }],
    splitType: 'equal',
    splitWithMemberIds: ['user-alex', 'user-brenda', 'user-carlos', 'user-diana'],
    notes: 'Reserved green car seats for group',
    createdBy: 'user-alex',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'exp-ginza-omakase',
    tripId: 'trip-japan-2026',
    title: 'Ginza Premium Sushi Omakase 🍣',
    category: 'food',
    amount: 340,
    currency: 'USD',
    exchangeRate: 1,
    date: '2026-08-11',
    paidBy: [{ userId: 'user-brenda', amount: 340 }],
    splitType: 'itemized',
    splitWithMemberIds: ['user-alex', 'user-brenda', 'user-carlos', 'user-diana'],
    taxAmount: 25,
    tipAmount: 35,
    itemizedItems: [
      { id: 'item-1', name: 'Chef Special Nigiri Set (Alex)', amount: 80, assignedMemberIds: ['user-alex'] },
      { id: 'item-2', name: 'Premium Otoro & Uni (Brenda)', amount: 75, assignedMemberIds: ['user-brenda'] },
      { id: 'item-3', name: 'A5 Wagyu Beef Sushi Course (Carlos)', amount: 85, assignedMemberIds: ['user-carlos'] },
      { id: 'item-4', name: 'Vegetarian Kaiseki Set (Diana)', amount: 40, assignedMemberIds: ['user-diana'] },
    ],
    notes: 'Itemized dinner with 10% tax and service fee distributed proportionally',
    createdBy: 'user-brenda',
    createdAt: '2026-08-11T20:30:00.000Z',
    updatedAt: '2026-08-11T20:30:00.000Z',
  },
  {
    id: 'exp-kyoto-machiya',
    tripId: 'trip-japan-2026',
    title: 'Traditional Machiya Villa (3 Nights in Gion)',
    category: 'lodging',
    amount: 880,
    currency: 'USD',
    exchangeRate: 1,
    date: '2026-08-12',
    paidBy: [
      { userId: 'user-alex', amount: 480 },
      { userId: 'user-carlos', amount: 400 },
    ],
    splitType: 'equal',
    splitWithMemberIds: ['user-alex', 'user-brenda', 'user-carlos', 'user-diana'],
    notes: 'Split equally between all 4 travelers, paid partially by Alex and Carlos',
    createdBy: 'user-alex',
    createdAt: '2026-08-12T14:00:00.000Z',
    updatedAt: '2026-08-12T14:00:00.000Z',
  },
  {
    id: 'exp-matcha-cafe',
    tripId: 'trip-japan-2026',
    title: 'Matcha Parfaits & Lattes in Uji',
    category: 'food',
    amount: 36,
    currency: 'USD',
    exchangeRate: 1,
    date: '2026-08-13',
    paidBy: [{ userId: 'user-carlos', amount: 36 }],
    splitType: 'equal',
    splitWithMemberIds: ['user-alex', 'user-brenda', 'user-carlos'],
    notes: 'Diana was shopping and did not attend',
    createdBy: 'user-carlos',
    createdAt: '2026-08-13T15:30:00.000Z',
    updatedAt: '2026-08-13T15:30:00.000Z',
  },
  {
    id: 'exp-akihabara-merch',
    tripId: 'trip-japan-2026',
    title: 'Anime Figures & Souvenirs',
    category: 'shopping',
    amount: 75,
    currency: 'USD',
    exchangeRate: 1,
    date: '2026-08-14',
    paidBy: [{ userId: 'user-diana', amount: 75 }],
    splitType: 'exact',
    splitWithMemberIds: ['user-diana'],
    customSplits: { 'user-diana': 75 },
    notes: 'Personal souvenir purchase by Diana',
    createdBy: 'user-diana',
    createdAt: '2026-08-14T17:00:00.000Z',
    updatedAt: '2026-08-14T17:00:00.000Z',
  },
];

export const SEED_SETTLEMENTS: Settlement[] = [
  {
    id: 'settle-1',
    tripId: 'trip-japan-2026',
    fromUserId: 'user-carlos',
    toUserId: 'user-alex',
    amount: 100,
    currency: 'USD',
    date: '2026-08-15',
    paymentMethod: 'venmo',
    notes: 'Partial settlement for Shinkansen train ticket',
    createdAt: '2026-08-15T19:00:00.000Z',
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    tripId: 'trip-japan-2026',
    userId: 'user-alex',
    userName: 'Alex Rivera',
    action: 'UPDATE_TRIP',
    details: 'Created trip "Japan Sakura Expedition 🌸" with base currency USD',
    timestamp: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'audit-2',
    tripId: 'trip-japan-2026',
    userId: 'user-alex',
    userName: 'Alex Rivera',
    action: 'CREATE_EXPENSE',
    details: 'Added expense "Shinkansen Bullet Train Passes" ($520.00)',
    timestamp: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'audit-3',
    tripId: 'trip-japan-2026',
    userId: 'user-brenda',
    userName: 'Brenda Chen',
    action: 'CREATE_EXPENSE',
    details: 'Added itemized expense "Ginza Premium Sushi Omakase" ($340.00)',
    timestamp: '2026-08-11T20:30:00.000Z',
  },
  {
    id: 'audit-4',
    tripId: 'trip-japan-2026',
    userId: 'user-carlos',
    userName: 'Carlos Gomez',
    action: 'RECORD_SETTLEMENT',
    details: 'Recorded settlement payment of $100.00 to Alex Rivera via Venmo',
    timestamp: '2026-08-15T19:00:00.000Z',
  },
];

export async function initializeDatabaseSeed(forceReset: boolean = false): Promise<void> {
  const existingTripsCount = await db.trips.count();
  if (existingTripsCount > 0 && !forceReset) {
    return; // Already initialized
  }

  await db.transaction('rw', [db.users, db.trips, db.expenses, db.settlements, db.auditLogs], async () => {
    if (forceReset) {
      await db.users.clear();
      await db.trips.clear();
      await db.expenses.clear();
      await db.settlements.clear();
      await db.auditLogs.clear();
    }

    await db.users.bulkPut(SEED_USERS);
    await db.trips.put(SEED_TRIP);
    await db.expenses.bulkPut(SEED_EXPENSES);
    await db.settlements.bulkPut(SEED_SETTLEMENTS);
    await db.auditLogs.bulkPut(SEED_AUDIT_LOGS);
  });
}
