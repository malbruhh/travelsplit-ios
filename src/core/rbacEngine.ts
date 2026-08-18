import type { TripRole } from '../types';

export const rbacEngine = {
  canManageTrip(role: TripRole): boolean {
    return role === 'owner';
  },

  canManageMembers(role: TripRole): boolean {
    return role === 'owner';
  },

  canAddExpense(role: TripRole): boolean {
    return role === 'owner' || role === 'editor';
  },

  canEditExpense(role: TripRole, expenseCreatedBy: string, currentUserId: string): boolean {
    if (role === 'owner') return true;
    if (role === 'editor' && expenseCreatedBy === currentUserId) return true;
    return false;
  },

  canDeleteExpense(role: TripRole, expenseCreatedBy: string, currentUserId: string): boolean {
    if (role === 'owner') return true;
    if (role === 'editor' && expenseCreatedBy === currentUserId) return true;
    return false;
  },

  canRecordSettlement(role: TripRole): boolean {
    return role === 'owner' || role === 'editor';
  },

  getRoleLabel(role: TripRole): string {
    switch (role) {
      case 'owner':
        return 'Trip Owner';
      case 'editor':
        return 'Member (Editor)';
      case 'viewer':
        return 'Guest (Viewer)';
    }
  },

  getRoleBadgeClass(role: TripRole): string {
    switch (role) {
      case 'owner':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'editor':
        return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30';
      case 'viewer':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    }
  }
};
