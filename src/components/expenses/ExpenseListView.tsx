import React from 'react';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { splitEngine } from '../../core/splitEngine';
import { formatCurrency, formatDate, triggerHaptic } from '../../lib/utils';
import type { ExpenseCategory } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { rbacEngine } from '../../core/rbacEngine';
import { Search, Plus, Utensils, Train, Home, Ticket, ShoppingCart, ShoppingBag, AlertTriangle, Layers } from 'lucide-react';

const CATEGORIES: { id: ExpenseCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" />, color: 'bg-zinc-500/10 text-zinc-600' },
  { id: 'food', label: 'Food', icon: <Utensils className="w-3.5 h-3.5" />, color: 'bg-orange-500/15 text-orange-600' },
  { id: 'transport', label: 'Transport', icon: <Train className="w-3.5 h-3.5" />, color: 'bg-blue-500/15 text-blue-600' },
  { id: 'lodging', label: 'Lodging', icon: <Home className="w-3.5 h-3.5" />, color: 'bg-indigo-500/15 text-indigo-600' },
  { id: 'activities', label: 'Activities', icon: <Ticket className="w-3.5 h-3.5" />, color: 'bg-emerald-500/15 text-emerald-600' },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-pink-500/15 text-pink-600' },
  { id: 'groceries', label: 'Groceries', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: 'bg-amber-500/15 text-amber-600' },
  { id: 'emergency', label: 'Emergency', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-red-500/15 text-red-600' },
];

export const getCategoryIcon = (category: ExpenseCategory) => {
  switch (category) {
    case 'food': return <Utensils className="w-4 h-4 text-orange-500" />;
    case 'transport': return <Train className="w-4 h-4 text-blue-500" />;
    case 'lodging': return <Home className="w-4 h-4 text-indigo-500" />;
    case 'activities': return <Ticket className="w-4 h-4 text-emerald-500" />;
    case 'shopping': return <ShoppingBag className="w-4 h-4 text-pink-500" />;
    case 'groceries': return <ShoppingCart className="w-4 h-4 text-amber-500" />;
    case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default: return <Layers className="w-4 h-4 text-zinc-500" />;
  }
};

export const ExpenseListView: React.FC = () => {
  const {
    expenses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useExpenseStore();
  const { activeTrip } = useTripStore();
  const { currentUser, activeRole } = useAuthStore();
  const { openAddExpense } = useUiStore();
  const canAdd = rbacEngine.canAddExpense(activeRole);

  // Filtering
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchNotes = exp.notes?.toLowerCase().includes(q);
      return matchTitle || matchNotes;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search expenses, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-xs bg-zinc-100 dark:bg-zinc-800/70 border-none rounded-ios"
        />
      </div>

      {/* Horizontal Scrollable Category Filter Pills */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isSelected
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expense List Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 px-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Utensils className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No expenses found</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try changing your search filters'
              : 'Add your first group or individual travel expense'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => {
            const splitResult = splitEngine.calculate(exp);
            const myConsumedShare = currentUser ? (splitResult.memberShares[currentUser.id] || 0) : 0;
            const payerNames = exp.paidBy
              .map((p) => {
                const member = activeTrip?.members.find((m) => m.userId === p.userId);
                return member ? member.name.split(' ')[0] : 'Someone';
              })
              .join(', ');

            return (
              <Card
                key={exp.id}
                onClick={() => {
                  triggerHaptic('light');
                  openAddExpense(exp.id);
                }}
                className="cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all"
              >
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-ios bg-zinc-100 dark:bg-zinc-800/90 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{exp.title}</h4>
                      <div className="flex items-center space-x-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{formatDate(exp.date)}</span>
                        <span>•</span>
                        <span className="truncate">Paid by <strong className="text-foreground">{payerNames}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {exp.splitType}
                        </span>
                        {currentUser && myConsumedShare > 0 && (
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            Your share: {formatCurrency(myConsumedShare, exp.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(exp.amount, exp.currency)}
                    </p>
                    {exp.currency !== activeTrip?.baseCurrency && (
                      <span className="text-[9px] text-muted-foreground">
                        ≈ {formatCurrency(exp.amount * exp.exchangeRate, activeTrip?.baseCurrency || 'USD')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
