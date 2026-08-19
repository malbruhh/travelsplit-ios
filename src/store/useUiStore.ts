import { create } from 'zustand';

export type MainTab = 'trips' | 'expenses' | 'myspend' | 'settle';

interface UiState {
  activeTab: MainTab;
  isAddExpenseOpen: boolean;
  isCreateTripOpen: boolean;
  isSettleModalOpen: boolean;
  isExportModalOpen: boolean;
  isAuditModalOpen: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  isMemberModalOpen: boolean;
  isMobilePreviewFrame: boolean;
  editingExpenseId: string | null;
  suggestedSettlementTransfer: { fromUserId: string; toUserId: string; amount: number } | null;

  // Actions
  setActiveTab: (tab: MainTab) => void;
  openAddExpense: (expenseId?: string) => void;
  closeAddExpense: () => void;
  setCreateTripOpen: (open: boolean) => void;
  openSettleModal: (transfer?: { fromUserId: string; toUserId: string; amount: number }) => void;
  closeSettleModal: () => void;
  setExportModalOpen: (open: boolean) => void;
  setAuditModalOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  setMemberModalOpen: (open: boolean) => void;
  toggleMobilePreviewFrame: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'expenses',
  isAddExpenseOpen: false,
  isCreateTripOpen: false,
  isSettleModalOpen: false,
  isExportModalOpen: false,
  isAuditModalOpen: false,
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  isMemberModalOpen: false,
  isMobilePreviewFrame: true, // Default to iOS iPhone mobile viewport preview frame!
  editingExpenseId: null,
  suggestedSettlementTransfer: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  openAddExpense: (expenseId) => set({ isAddExpenseOpen: true, editingExpenseId: expenseId || null }),
  closeAddExpense: () => set({ isAddExpenseOpen: false, editingExpenseId: null }),
  setCreateTripOpen: (open) => set({ isCreateTripOpen: open }),
  openSettleModal: (transfer) => set({ isSettleModalOpen: true, suggestedSettlementTransfer: transfer || null }),
  closeSettleModal: () => set({ isSettleModalOpen: false, suggestedSettlementTransfer: null }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setAuditModalOpen: (open) => set({ isAuditModalOpen: open }),
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  setMemberModalOpen: (open) => set({ isMemberModalOpen: open }),
  toggleMobilePreviewFrame: () => set((state) => ({ isMobilePreviewFrame: !state.isMobilePreviewFrame })),
}));
