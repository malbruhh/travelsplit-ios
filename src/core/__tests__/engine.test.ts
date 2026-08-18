import { describe, it, expect } from 'vitest';
import { splitEngine } from '../splitEngine';
import { debtEngine } from '../debtEngine';
import { analyticsEngine } from '../analyticsEngine';
import { rbacEngine } from '../rbacEngine';
import type { Expense, TripMember, Settlement } from '../../types';

describe('Split Engine Math Verification', () => {
  it('correctly splits an amount equally with cent-rounding accuracy (e.g. $100 / 3)', () => {
    const expense: Expense = {
      id: 'test-exp-1',
      tripId: 'trip-1',
      title: 'Dinner',
      category: 'food',
      amount: 100,
      currency: 'USD',
      exchangeRate: 1,
      date: '2026-08-18',
      paidBy: [{ userId: 'user-a', amount: 100 }],
      splitType: 'equal',
      splitWithMemberIds: ['user-a', 'user-b', 'user-c'],
      createdBy: 'user-a',
      createdAt: '2026-08-18',
      updatedAt: '2026-08-18',
    };

    const res = splitEngine.calculate(expense);
    expect(res.totalAllocated).toBe(100);
    expect(res.remainder).toBe(0);
    expect(res.memberShares['user-a']).toBe(33.34);
    expect(res.memberShares['user-b']).toBe(33.33);
    expect(res.memberShares['user-c']).toBe(33.33);
  });

  it('correctly calculates weighted shares', () => {
    const expense: Expense = {
      id: 'test-exp-2',
      tripId: 'trip-1',
      title: 'Airbnb',
      category: 'lodging',
      amount: 300,
      currency: 'USD',
      exchangeRate: 1,
      date: '2026-08-18',
      paidBy: [{ userId: 'user-a', amount: 300 }],
      splitType: 'shares',
      splitWithMemberIds: ['user-a', 'user-b', 'user-c'],
      customSplits: {
        'user-a': 2, // couple (2 shares)
        'user-b': 1, // single (1 share)
        'user-c': 0.5, // kid (0.5 share) -> total = 3.5 shares
      },
      createdBy: 'user-a',
      createdAt: '2026-08-18',
      updatedAt: '2026-08-18',
    };

    const res = splitEngine.calculate(expense);
    expect(res.memberShares['user-a']).toBeCloseTo((300 * 2) / 3.5, 1);
    expect(res.memberShares['user-b']).toBeCloseTo((300 * 1) / 3.5, 1);
    expect(res.memberShares['user-c']).toBeCloseTo((300 * 0.5) / 3.5, 1);
  });

  it('correctly calculates itemized receipt with proportional tax and tip', () => {
    // Total: Subtotal $200 + Tax $20 + Tip $40 = $260
    const expense: Expense = {
      id: 'test-exp-itemized',
      tripId: 'trip-1',
      title: 'Team Feast',
      category: 'food',
      amount: 260,
      currency: 'USD',
      exchangeRate: 1,
      date: '2026-08-18',
      paidBy: [{ userId: 'user-a', amount: 260 }],
      splitType: 'itemized',
      splitWithMemberIds: ['user-a', 'user-b'],
      taxAmount: 20,
      tipAmount: 40,
      itemizedItems: [
        { id: 'i1', name: 'Steak', amount: 150, assignedMemberIds: ['user-a'] }, // 75% of subtotal
        { id: 'i2', name: 'Pasta', amount: 50, assignedMemberIds: ['user-b'] },  // 25% of subtotal
      ],
      createdBy: 'user-a',
      createdAt: '2026-08-18',
      updatedAt: '2026-08-18',
    };

    const res = splitEngine.calculate(expense);
    // User A: $150 + 75% of ($20 tax + $40 tip) = $150 + $15 + $30 = $195
    expect(res.memberShares['user-a']).toBe(195);
    // User B: $50 + 25% of ($20 tax + $40 tip) = $50 + $5 + $10 = $65
    expect(res.memberShares['user-b']).toBe(65);
    expect(res.totalAllocated).toBe(260);
  });
});

describe('Debt Simplification Engine', () => {
  it('cancels circular debts completely (A owes B $50, B owes C $50, C owes A $50)', () => {
    // Balances are all 0 because everyone paid 50 and consumed 50
    const balances = {
      'user-a': 0,
      'user-b': 0,
      'user-c': 0,
    };

    const transfers = debtEngine.simplifyDebts(balances);
    expect(transfers.length).toBe(0);
  });

  it('minimizes 3-party chain debt into direct minimal transfers', () => {
    // User A is owed $100 (+100), User B owes $60 (-60), User C owes $40 (-40)
    const balances = {
      'user-a': 100,
      'user-b': -60,
      'user-c': -40,
    };

    const transfers = debtEngine.simplifyDebts(balances);
    expect(transfers.length).toBe(2);
    expect(transfers).toContainEqual({ fromUserId: 'user-b', toUserId: 'user-a', amount: 60 });
    expect(transfers).toContainEqual({ fromUserId: 'user-c', toUserId: 'user-a', amount: 40 });
  });
});

describe('Analytics Engine & Consumption Integrity', () => {
  it('ensures sum of individual consumed equals total trip expenses', () => {
    const members: TripMember[] = [
      { userId: 'user-a', name: 'Alex', role: 'owner', avatarColor: '#007AFF', defaultWeight: 1 },
      { userId: 'user-b', name: 'Brenda', role: 'editor', avatarColor: '#34C759', defaultWeight: 1 },
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Lunch',
        category: 'food',
        amount: 80,
        currency: 'USD',
        exchangeRate: 1,
        date: '2026-08-18',
        paidBy: [{ userId: 'user-a', amount: 80 }],
        splitType: 'equal',
        splitWithMemberIds: ['user-a', 'user-b'],
        createdBy: 'user-a',
        createdAt: '2026-08-18',
        updatedAt: '2026-08-18',
      },
      {
        id: 'e2',
        tripId: 'trip-1',
        title: 'Souvenir',
        category: 'shopping',
        amount: 30,
        currency: 'USD',
        exchangeRate: 1,
        date: '2026-08-18',
        paidBy: [{ userId: 'user-b', amount: 30 }],
        splitType: 'exact',
        splitWithMemberIds: ['user-b'],
        customSplits: { 'user-b': 30 },
        createdBy: 'user-b',
        createdAt: '2026-08-18',
        updatedAt: '2026-08-18',
      }
    ];

    const resA = analyticsEngine.calculateIndividualSpending('user-a', expenses);
    const resB = analyticsEngine.calculateIndividualSpending('user-b', expenses);

    expect(resA.summary.totalConsumed + resB.summary.totalConsumed).toBe(110);
    expect(resA.summary.totalPaid).toBe(80);
    expect(resB.summary.totalPaid).toBe(30);
    expect(resA.summary.categoryBreakdown.food).toBe(40);
    expect(resB.summary.categoryBreakdown.shopping).toBe(30);
  });
});

describe('RBAC Permission Guard Verification', () => {
  it('verifies owner permissions', () => {
    expect(rbacEngine.canManageTrip('owner')).toBe(true);
    expect(rbacEngine.canManageMembers('owner')).toBe(true);
    expect(rbacEngine.canAddExpense('owner')).toBe(true);
    expect(rbacEngine.canEditExpense('owner', 'user-other', 'user-owner')).toBe(true);
  });

  it('verifies editor permissions', () => {
    expect(rbacEngine.canManageTrip('editor')).toBe(false);
    expect(rbacEngine.canManageMembers('editor')).toBe(false);
    expect(rbacEngine.canAddExpense('editor')).toBe(true);
    expect(rbacEngine.canEditExpense('editor', 'user-editor', 'user-editor')).toBe(true);
    expect(rbacEngine.canEditExpense('editor', 'user-other', 'user-editor')).toBe(false);
  });

  it('verifies viewer permissions', () => {
    expect(rbacEngine.canManageTrip('viewer')).toBe(false);
    expect(rbacEngine.canAddExpense('viewer')).toBe(false);
    expect(rbacEngine.canEditExpense('viewer', 'user-viewer', 'user-viewer')).toBe(false);
    expect(rbacEngine.canRecordSettlement('viewer')).toBe(false);
  });
});
