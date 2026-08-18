import type { Expense } from '../types';

export interface SplitCalculationResult {
  memberShares: Record<string, number>; // memberId -> exact amount in expense currency
  subtotals?: Record<string, number>;  // For itemized: raw item subtotal before tax/tip
  taxShares?: Record<string, number>;  // For itemized: tax portion per member
  tipShares?: Record<string, number>;  // For itemized: tip portion per member
  totalAllocated: number;
  remainder: number;
}

export const splitEngine = {
  /**
   * Calculates the exact share for each member from an expense.
   * Handles Equal, Exact, Percentage, Shares, and Itemized distributions with cent-rounding accuracy.
   */
  calculate(expense: Expense): SplitCalculationResult {
    const { amount, splitType, splitWithMemberIds, customSplits, itemizedItems, taxAmount = 0, tipAmount = 0 } = expense;

    if (!splitWithMemberIds || splitWithMemberIds.length === 0) {
      return { memberShares: {}, totalAllocated: 0, remainder: amount };
    }

    const memberShares: Record<string, number> = {};
    splitWithMemberIds.forEach(id => { memberShares[id] = 0; });

    switch (splitType) {
      case 'equal': {
        const count = splitWithMemberIds.length;
        const baseShareInCents = Math.floor((amount * 100) / count);
        let remainderCents = Math.round(amount * 100) - (baseShareInCents * count);

        splitWithMemberIds.forEach((memberId, idx) => {
          // Distribute remainder cents to first N members
          const extraCent = idx < remainderCents ? 1 : 0;
          memberShares[memberId] = (baseShareInCents + extraCent) / 100;
        });

        const totalAllocated = Object.values(memberShares).reduce((sum, val) => sum + val, 0);
        return {
          memberShares,
          totalAllocated: roundCents(totalAllocated),
          remainder: roundCents(amount - totalAllocated),
        };
      }

      case 'exact': {
        let totalAllocated = 0;
        splitWithMemberIds.forEach(memberId => {
          const exactVal = customSplits?.[memberId] ?? 0;
          memberShares[memberId] = roundCents(exactVal);
          totalAllocated += memberShares[memberId];
        });

        return {
          memberShares,
          totalAllocated: roundCents(totalAllocated),
          remainder: roundCents(amount - totalAllocated),
        };
      }

      case 'percentage': {
        let totalAllocated = 0;
        splitWithMemberIds.forEach(memberId => {
          const pct = customSplits?.[memberId] ?? (100 / splitWithMemberIds.length);
          const share = roundCents((amount * pct) / 100);
          memberShares[memberId] = share;
          totalAllocated += share;
        });

        return {
          memberShares,
          totalAllocated: roundCents(totalAllocated),
          remainder: roundCents(amount - totalAllocated),
        };
      }

      case 'shares': {
        let totalWeight = 0;
        splitWithMemberIds.forEach(memberId => {
          const weight = customSplits?.[memberId] ?? 1;
          totalWeight += weight > 0 ? weight : 1;
        });

        let totalAllocated = 0;
        splitWithMemberIds.forEach(memberId => {
          const weight = customSplits?.[memberId] ?? 1;
          const share = roundCents((amount * (weight > 0 ? weight : 1)) / totalWeight);
          memberShares[memberId] = share;
          totalAllocated += share;
        });

        return {
          memberShares,
          totalAllocated: roundCents(totalAllocated),
          remainder: roundCents(amount - totalAllocated),
        };
      }

      case 'itemized': {
        const subtotals: Record<string, number> = {};
        const taxShares: Record<string, number> = {};
        const tipShares: Record<string, number> = {};

        splitWithMemberIds.forEach(id => {
          subtotals[id] = 0;
          taxShares[id] = 0;
          tipShares[id] = 0;
        });

        // 1. Calculate base item portions
        if (itemizedItems && itemizedItems.length > 0) {
          itemizedItems.forEach(item => {
            const assigned = item.assignedMemberIds.filter(id => splitWithMemberIds.includes(id));
            if (assigned.length > 0) {
              const itemShare = item.amount / assigned.length;
              assigned.forEach(id => {
                subtotals[id] = (subtotals[id] || 0) + itemShare;
              });
            }
          });
        }

        const totalItemsSum = Object.values(subtotals).reduce((sum, val) => sum + val, 0);

        // 2. Distribute tax and tip proportionally based on each person's subtotal fraction
        splitWithMemberIds.forEach(id => {
          const personSubtotal = subtotals[id] || 0;
          const proportion = totalItemsSum > 0 ? personSubtotal / totalItemsSum : (1 / splitWithMemberIds.length);

          const personTax = roundCents(taxAmount * proportion);
          const personTip = roundCents(tipAmount * proportion);

          taxShares[id] = personTax;
          tipShares[id] = personTip;
          memberShares[id] = roundCents(personSubtotal + personTax + personTip);
        });

        const totalAllocated = Object.values(memberShares).reduce((sum, val) => sum + val, 0);

        return {
          memberShares,
          subtotals,
          taxShares,
          tipShares,
          totalAllocated: roundCents(totalAllocated),
          remainder: roundCents(amount - totalAllocated),
        };
      }
    }
  }
};

function roundCents(val: number): number {
  return Math.round(val * 100) / 100;
}
