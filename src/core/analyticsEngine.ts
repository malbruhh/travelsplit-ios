import type { Expense, Settlement, ExpenseCategory, MemberSpendingSummary, IndividualLedgerItem } from '../types';
import { splitEngine } from './splitEngine';

export const INITIAL_CATEGORY_BREAKDOWN: Record<ExpenseCategory, number> = {
  food: 0,
  transport: 0,
  lodging: 0,
  activities: 0,
  groceries: 0,
  shopping: 0,
  emergency: 0,
  general: 0,
};

export const analyticsEngine = {
  /**
   * Computes the deep individual spending metrics for a specific member.
   */
  calculateIndividualSpending(
    memberId: string,
    expenses: Expense[],
    settlements: Settlement[] = []
  ): {
    summary: MemberSpendingSummary;
    ledger: IndividualLedgerItem[];
  } {
    let totalPaid = 0;
    let totalConsumed = 0;
    const categoryBreakdown: Record<ExpenseCategory, number> = { ...INITIAL_CATEGORY_BREAKDOWN };
    const ledger: IndividualLedgerItem[] = [];

    // 1. Process all expenses
    expenses.forEach(exp => {
      const rate = exp.exchangeRate || 1;

      // Check how much this person paid upfront
      const payerEntry = exp.paidBy.find(p => p.userId === memberId);
      const paidByMe = payerEntry ? payerEntry.amount * rate : 0;
      totalPaid += paidByMe;

      // Check how much this person consumed
      const splitResult = splitEngine.calculate(exp);
      const consumedShare = (splitResult.memberShares[memberId] || 0) * rate;
      totalConsumed += consumedShare;

      // Add to category breakdown if this person consumed any of this expense
      if (consumedShare > 0) {
        categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + consumedShare;
      }

      // Add to personal ledger if this person paid or consumed in this expense
      if (paidByMe > 0 || consumedShare > 0) {
        ledger.push({
          expenseId: exp.id,
          title: exp.title,
          date: exp.date,
          category: exp.category,
          totalAmount: exp.amount * rate,
          myConsumedPortion: roundCents(consumedShare),
          paidByMe: roundCents(paidByMe),
          splitType: exp.splitType,
          currency: exp.currency,
          notes: exp.notes,
        });
      }
    });

    // 2. Adjust settlements for netBalance
    let settlementAdjustment = 0;
    settlements.forEach(s => {
      if (s.fromUserId === memberId) {
        // I paid someone: my debt is reduced (+ to my net balance)
        settlementAdjustment += s.amount;
      } else if (s.toUserId === memberId) {
        // Someone paid me: what was owed to me is settled (- to my net balance)
        settlementAdjustment -= s.amount;
      }
    });

    const netBalance = roundCents(totalPaid - totalConsumed + settlementAdjustment);

    // Round category breakdown
    Object.keys(categoryBreakdown).forEach(cat => {
      categoryBreakdown[cat as ExpenseCategory] = roundCents(categoryBreakdown[cat as ExpenseCategory]);
    });

    // Sort ledger by date descending
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      summary: {
        userId: memberId,
        totalPaid: roundCents(totalPaid),
        totalConsumed: roundCents(totalConsumed),
        netBalance,
        categoryBreakdown,
      },
      ledger,
    };
  },

  /**
   * Computes high-level trip statistics for the entire group.
   */
  calculateTripSummary(expenses: Expense[]) {
    let totalSpent = 0;
    const categoryTotals: Record<ExpenseCategory, number> = { ...INITIAL_CATEGORY_BREAKDOWN };

    expenses.forEach(exp => {
      const rate = exp.exchangeRate || 1;
      const convertedAmount = exp.amount * rate;
      totalSpent += convertedAmount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + convertedAmount;
    });

    // Round category totals
    Object.keys(categoryTotals).forEach(cat => {
      categoryTotals[cat as ExpenseCategory] = roundCents(categoryTotals[cat as ExpenseCategory]);
    });

    return {
      totalSpent: roundCents(totalSpent),
      categoryTotals,
      expenseCount: expenses.length,
    };
  }
};

function roundCents(val: number): number {
  return Math.round(val * 100) / 100;
}
