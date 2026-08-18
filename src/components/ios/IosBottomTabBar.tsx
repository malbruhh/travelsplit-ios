import React from 'react';
import { useUiStore, type MainTab } from '../../store/useUiStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { rbacEngine } from '../../core/rbacEngine';
import { Compass, Receipt, Plus, PieChart, ArrowLeftRight } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

export const IosBottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, openAddExpense } = useUiStore();
  const { expenses } = useExpenseStore();
  const { activeRole } = useAuthStore();

  const canAdd = rbacEngine.canAddExpense(activeRole);

  const handleTabClick = (tab: MainTab) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <div className="sticky bottom-0 z-30 ios-glass border-t border-zinc-200/80 dark:border-zinc-800/80 px-3 pt-1.5 pb-5 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Tab 1: Trips */}
        <button
          onClick={() => handleTabClick('trips')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'trips' ? 'text-ios-blue font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'trips' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Trips</span>
        </button>

        {/* Tab 2: Expenses */}
        <button
          onClick={() => handleTabClick('expenses')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all active:scale-90 ${
            activeTab === 'expenses' ? 'text-ios-blue font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'expenses' ? 2.5 : 1.8} />
            {expenses.length > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-ios-blue text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                {expenses.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Expenses</span>
        </button>

        {/* Center Prominent Action: Add Expense (+) */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            onClick={() => {
              if (canAdd) {
                triggerHaptic('medium');
                openAddExpense();
              }
            }}
            disabled={!canAdd}
            title={canAdd ? 'Add Expense' : 'Viewers cannot add expenses'}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 ${
              canAdd
                ? 'bg-ios-blue text-white hover:bg-blue-600 shadow-blue-500/30 ring-4 ring-background'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed ring-4 ring-background'
            }`}
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Tab 3: My Spend */}
        <button
          onClick={() => handleTabClick('myspend')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'myspend' ? 'text-ios-blue font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'myspend' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">My Spend</span>
        </button>

        {/* Tab 4: Settle Up */}
        <button
          onClick={() => handleTabClick('settle')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'settle' ? 'text-ios-blue font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'settle' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Settle Up</span>
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-32 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2 opacity-60" />
    </div>
  );
};
