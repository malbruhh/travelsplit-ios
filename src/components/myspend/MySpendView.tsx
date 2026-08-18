import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettlementStore } from '../../store/useSettlementStore';
import { useUiStore } from '../../store/useUiStore';
import { analyticsEngine } from '../../core/analyticsEngine';
import { formatCurrency, formatDate, triggerHaptic } from '../../lib/utils';
import { getCategoryIcon } from '../expenses/ExpenseListView';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Receipt, PieChart as PieIcon, Sparkles } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF9500',        // iOS Orange
  transport: '#007AFF',   // iOS Blue
  lodging: '#5856D6',     // iOS Indigo
  activities: '#34C759',  // iOS Green
  shopping: '#FF2D55',    // iOS Pink
  groceries: '#FFCC00',   // iOS Yellow
  emergency: '#FF3B30',   // iOS Red
  general: '#8E8E93',     // iOS Gray
};

export const MySpendView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { activeTrip } = useTripStore();
  const { expenses } = useExpenseStore();
  const { settlements } = useSettlementStore();
  const { openAddExpense, setAuthModalOpen } = useUiStore();

  if (!currentUser || !activeTrip) return null;

  const { summary, ledger } = analyticsEngine.calculateIndividualSpending(
    currentUser.id,
    expenses,
    settlements
  );

  // Prepare chart data
  const chartData = Object.entries(summary.categoryBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([cat, value]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[cat] || '#007AFF',
    }));

  return (
    <div className="p-4 space-y-4">
      {/* Traveler Header Pill */}
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-ios border border-zinc-200/60 dark:border-zinc-700/60">
        <div className="flex items-center space-x-2.5">
          <Avatar className="w-9 h-9">
            <AvatarFallback style={{ backgroundColor: currentUser.avatarColor }} className="text-xs font-bold text-white">
              {currentUser.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Individual Spend Lens</span>
            <h3 className="text-sm font-bold text-foreground">{currentUser.name}</h3>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setAuthModalOpen(true);
          }}
          className="text-xs text-ios-blue font-bold hover:underline"
        >
          Switch ▾
        </button>
      </div>

      {/* 3 Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Metric 1: True Consumed */}
        <div className="col-span-2 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 rounded-ios-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">True Personal Consumption</span>
            </div>
            <span className="text-[10px] text-muted-foreground">What you actually consumed</span>
          </div>
          <p className="text-2xl font-black text-foreground mt-2 tracking-tight">
            {formatCurrency(summary.totalConsumed, activeTrip.baseCurrency)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Calculated across your shares in {ledger.length} individual items & shared bills.
          </p>
        </div>

        {/* Metric 2: Paid Out of Pocket */}
        <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-ios p-3 shadow-ios-card">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-xs font-semibold">
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
            <span>Paid Upfront</span>
          </div>
          <p className="text-base font-bold text-foreground mt-1">
            {formatCurrency(summary.totalPaid, activeTrip.baseCurrency)}
          </p>
          <span className="text-[10px] text-muted-foreground">Cash out-of-pocket</span>
        </div>

        {/* Metric 3: Net Balance */}
        <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-ios p-3 shadow-ios-card">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-xs font-semibold">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>Settlement Balance</span>
          </div>
          <p
            className={`text-base font-bold mt-1 ${
              summary.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
            }`}
          >
            {summary.netBalance >= 0 ? `+${formatCurrency(summary.netBalance, activeTrip.baseCurrency)}` : formatCurrency(summary.netBalance, activeTrip.baseCurrency)}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {summary.netBalance >= 0 ? 'Owed to you' : 'Your debt'}
          </span>
        </div>
      </div>

      {/* Category Breakdown Donut Chart */}
      {chartData.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-ios-blue" />
              Category Breakdown
            </h4>
            <span className="text-[10px] text-muted-foreground">{chartData.length} Active Categories</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value) || 0, activeTrip.baseCurrency)}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(28, 28, 30, 0.9)',
                    color: '#fff',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend & Progress */}
          <div className="space-y-1.5 mt-2">
            {chartData.map((item) => {
              const pct = summary.totalConsumed > 0 ? Math.round((item.value / summary.totalConsumed) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800/50 last:border-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-[11px]">{pct}%</span>
                    <span className="font-bold">{formatCurrency(item.value, activeTrip.baseCurrency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Personal Consumption Ledger */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-ios-blue" />
            My Personal Line Items
          </h4>
          <span className="text-[10px] text-muted-foreground">{ledger.length} items</span>
        </div>

        {ledger.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-6">
            No expenses logged for this traveler yet.
          </p>
        ) : (
          <div className="space-y-2">
            {ledger.map((item) => (
              <Card
                key={item.expenseId}
                onClick={() => {
                  triggerHaptic('light');
                  openAddExpense(item.expenseId);
                }}
                className="cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all"
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-ios-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                      <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span>Total: {formatCurrency(item.totalAmount, item.currency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(item.myConsumedPortion, item.currency)}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      {item.paidByMe > 0 ? `Paid $${item.paidByMe.toFixed(2)}` : 'Shared'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
