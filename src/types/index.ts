export type TripRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatarColor: string;
  defaultCurrency: string;
  createdAt: string;
}

export interface TripMember {
  userId: string;
  name: string;
  role: TripRole;
  avatarColor: string;
  defaultWeight: number; // For shares split (e.g. 1 = standard, 0.5 = child, 2 = couple)
  email?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  baseCurrency: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  joinCode?: string; // 6-character code for friends to join from other devices
  members: TripMember[];
  archived: boolean;
  totalBudget?: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'activities'
  | 'groceries'
  | 'shopping'
  | 'emergency'
  | 'general';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';

export interface ItemizedBillItem {
  id: string;
  name: string;
  amount: number;
  assignedMemberIds: string[];
}

export interface PayerAllocation {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  exchangeRate: number; // Multiplier to convert to trip's baseCurrency (e.g. 1 USD = 155 JPY -> rate = 1/155)
  date: string;
  paidBy: PayerAllocation[];
  splitType: SplitType;
  splitWithMemberIds: string[]; // For subset equal/exact/%/shares
  customSplits?: Record<string, number>; // exact values (memberId -> amount), percentages (memberId -> %), or weights (memberId -> weight)
  itemizedItems?: ItemizedBillItem[];
  taxAmount?: number;
  tipAmount?: number;
  notes?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'venmo' | 'revolut' | 'bank' | 'paypal' | 'other';

export interface Settlement {
  id: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  action: 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE' | 'RECORD_SETTLEMENT' | 'ADD_MEMBER' | 'UPDATE_ROLE' | 'UPDATE_TRIP';
  details: string;
  timestamp: string;
}

export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rateToBase: number; // 1 Base Currency = X of this currency
}

export interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface MemberSpendingSummary {
  userId: string;
  totalPaid: number;       // Cash paid upfront
  totalConsumed: number;   // True personal consumption
  netBalance: number;      // totalPaid - totalConsumed - settlements
  categoryBreakdown: Record<ExpenseCategory, number>;
}

export interface IndividualLedgerItem {
  expenseId: string;
  title: string;
  date: string;
  category: ExpenseCategory;
  totalAmount: number;
  myConsumedPortion: number;
  paidByMe: number;
  splitType: SplitType;
  currency: string;
  notes?: string;
}
