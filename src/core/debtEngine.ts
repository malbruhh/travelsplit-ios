import type { TripMember, Expense, Settlement, DebtTransfer } from '../types';
import { splitEngine } from './splitEngine';

export interface MemberBalanceDetails {
  userId: string;
  totalPaid: number;
  totalConsumed: number;
  netBalance: number;
}

export const debtEngine = {
  /**
   * Computes the net balance for all members of a trip.
   * Positive (+) balance: member is owed money.
   * Negative (-) balance: member owes money.
   */
  calculateBalances(
    members: TripMember[],
    expenses: Expense[],
    settlements: Settlement[] = []
  ): Record<string, number> {
    const balances: Record<string, number> = {};
    members.forEach(m => { balances[m.userId] = 0; });

    // 1. Process expenses
    expenses.forEach(exp => {
      const rate = exp.exchangeRate || 1;

      // Add what each payer paid upfront
      exp.paidBy.forEach(payer => {
        balances[payer.userId] = (balances[payer.userId] || 0) + (payer.amount * rate);
      });

      // Subtract what each person consumed
      const splitResult = splitEngine.calculate(exp);
      Object.entries(splitResult.memberShares).forEach(([memberId, share]) => {
        balances[memberId] = (balances[memberId] || 0) - (share * rate);
      });
    });

    // 2. Process settlements
    settlements.forEach(settle => {
      // fromUserId paid toUserId, so fromUserId's debt is reduced (balance increases), toUserId's credit is reduced (balance decreases)
      balances[settle.fromUserId] = (balances[settle.fromUserId] || 0) + settle.amount;
      balances[settle.toUserId] = (balances[settle.toUserId] || 0) - settle.amount;
    });

    // Round all balances to 2 decimal places to avoid floating point cent artifacts
    Object.keys(balances).forEach(id => {
      balances[id] = Math.round(balances[id] * 100) / 100;
    });

    return balances;
  },

  /**
   * Simplifies multi-party debts into the minimum number of transactions using a greedy bipartite matching algorithm.
   */
  simplifyDebts(balances: Record<string, number>): DebtTransfer[] {
    const transfers: DebtTransfer[] = [];

    // Separate into debtors (< 0) and creditors (> 0)
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, bal]) => {
      const rounded = Math.round(bal * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ userId, amount: Math.abs(rounded) });
      } else if (rounded > 0.01) {
        creditors.push({ userId, amount: rounded });
      }
    });

    // Sort descending by amount
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmount = Math.min(debtor.amount, creditor.amount);
      const roundedSettle = Math.round(settleAmount * 100) / 100;

      if (roundedSettle > 0.009) {
        transfers.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount: roundedSettle,
        });
      }

      debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return transfers;
  }
};
