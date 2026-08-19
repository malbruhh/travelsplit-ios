import React from 'react';
import { useUiStore, type MainTab } from '../../store/useUiStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { rbacEngine } from '../../core/rbacEngine';
import { Compass, Receipt, Plus, PieChart, ArrowLeftRight } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

interface NavItem {
  id: MainTab;
  label: string;
  icon: React.ElementType;
  themeGradient: string;
  themeShadow: string;
  badge?: number;
}

export const IosBottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, openAddExpense } = useUiStore();
  const { expenses } = useExpenseStore();
  const { activeRole } = useAuthStore();

  const canAdd = rbacEngine.canAddExpense(activeRole);

  const leftNavItems: NavItem[] = [
    {
      id: 'trips',
      label: 'Trips',
      icon: Compass,
      themeGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      themeShadow: 'shadow-emerald-500/40',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      themeGradient: 'from-[#007AFF] via-blue-600 to-[#4F46E5]',
      themeShadow: 'shadow-blue-500/40',
      badge: expenses.length > 0 ? expenses.length : undefined,
    },
  ];

  const rightNavItems: NavItem[] = [
    {
      id: 'myspend',
      label: 'Analysis',
      icon: PieChart,
      themeGradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
      themeShadow: 'shadow-purple-500/40',
    },
    {
      id: 'settle',
      label: 'Settle',
      icon: ArrowLeftRight,
      themeGradient: 'from-teal-500 via-emerald-500 to-cyan-600',
      themeShadow: 'shadow-teal-500/40',
    },
  ];

  const handleTabClick = (tab: MainTab) => {
    triggerHaptic('medium');
    setActiveTab(tab);
  };

  const renderTabButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleTabClick(item.id)}
        aria-label={item.label}
        className="relative flex-1 flex flex-col items-center justify-center h-full group focus:outline-none"
      >
        {isActive ? (
          /* Active Tab: Circular Theme-Colored Highlight Bubble matching Overview design */
          <div
            className={`w-[56px] h-[56px] rounded-full bg-gradient-to-br ${item.themeGradient} text-white shadow-lg ${item.themeShadow} flex flex-col items-center justify-center transform active:scale-95 transition-all duration-200`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
              {item.badge ? (
                <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center ring-2 ring-white/20">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-bold mt-0.5 leading-tight tracking-tight text-white capitalize">
              {item.label}
            </span>
          </div>
        ) : (
          /* Inactive Tab: Uniform Muted Icon & Title-Case Label */
          <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors py-1">
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={1.8} />
              {item.badge ? (
                <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-medium leading-tight tracking-tight text-zinc-500 dark:text-zinc-400 capitalize">
              {item.label}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <footer className="fixed bottom-8 left-4 right-4 h-[72px] z-50 pointer-events-none">
      {/* 5-Slot Floating Capsule Navbar (matching Overview page specification) */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto max-w-sm mx-auto h-[72px] px-2 bg-white/85 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex items-center justify-between transition-all duration-300"
      >
        {/* Left Tabs: Trips & Expenses */}
        {leftNavItems.map(renderTabButton)}

        {/* Center Slot: '+' Add Expense Action */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => {
              if (canAdd) {
                triggerHaptic('medium');
                openAddExpense();
              }
            }}
            disabled={!canAdd}
            title={canAdd ? 'Add Expense' : 'Viewers cannot add expenses'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              canAdd
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                : 'bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Right Tabs: Analysis & Settle */}
        {rightNavItems.map(renderTabButton)}
      </nav>
    </footer>
  );
};
