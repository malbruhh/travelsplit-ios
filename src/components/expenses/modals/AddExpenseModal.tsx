import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '../../../store/useExpenseStore';
import { useTripStore } from '../../../store/useTripStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUiStore } from '../../../store/useUiStore';
import { splitEngine } from '../../../core/splitEngine';
import { rbacEngine } from '../../../core/rbacEngine';
import { SUPPORTED_CURRENCIES, currencyEngine } from '../../../core/currencyEngine';
import { formatCurrency, triggerHaptic } from '../../../lib/utils';
import type { Expense, ExpenseCategory, SplitType, ItemizedBillItem, PayerAllocation } from '../../../types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../../ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import {
  Utensils,
  Train,
  Home,
  Ticket,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  Check,
  Receipt,
  Users,
  DollarSign
} from 'lucide-react';

const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'food', label: 'Food', icon: <Utensils className="w-4 h-4 text-orange-500" /> },
  { id: 'transport', label: 'Transit', icon: <Train className="w-4 h-4 text-blue-500" /> },
  { id: 'lodging', label: 'Stay', icon: <Home className="w-4 h-4 text-indigo-500" /> },
  { id: 'activities', label: 'Activity', icon: <Ticket className="w-4 h-4 text-emerald-500" /> },
  { id: 'groceries', label: 'Groceries', icon: <ShoppingCart className="w-4 h-4 text-amber-500" /> },
  { id: 'shopping', label: 'Shop', icon: <ShoppingBag className="w-4 h-4 text-pink-500" /> },
  { id: 'emergency', label: 'Alert', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  { id: 'general', label: 'Other', icon: <Layers className="w-4 h-4 text-zinc-500" /> },
];

export const AddExpenseModal: React.FC = () => {
  const { isAddExpenseOpen, closeAddExpense, editingExpenseId } = useUiStore();
  const { activeTrip } = useTripStore();
  const { currentUser, activeRole } = useAuthStore();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();

  const editingExpense = editingExpenseId ? expenses.find((e) => e.id === editingExpenseId) : null;

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');

  // Payer state
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [primaryPayerId, setPrimaryPayerId] = useState('');
  const [multiPayers, setMultiPayers] = useState<Record<string, string>>({});

  // Split configurations
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactSplits, setExactSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});
  const [shareWeights, setShareWeights] = useState<Record<string, number>>({});

  // Itemized State
  const [itemizedList, setItemizedList] = useState<ItemizedBillItem[]>([
    { id: 'item-1', name: 'Item 1', amount: 0, assignedMemberIds: [] }
  ]);
  const [taxAmount, setTaxAmount] = useState('');
  const [tipAmount, setTipAmount] = useState('');

  // Sync state when opened or editing
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setCurrency(editingExpense.currency);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNotes(editingExpense.notes || '');
      setSplitType(editingExpense.splitType);

      if (editingExpense.paidBy.length > 1) {
        setIsMultiPayer(true);
        const map: Record<string, string> = {};
        editingExpense.paidBy.forEach((p) => { map[p.userId] = p.amount.toString(); });
        setMultiPayers(map);
      } else {
        setIsMultiPayer(false);
        setPrimaryPayerId(editingExpense.paidBy[0]?.userId || currentUser?.id || '');
      }

      setSelectedMemberIds(editingExpense.splitWithMemberIds || []);
      if (editingExpense.customSplits) {
        const strMap: Record<string, string> = {};
        Object.entries(editingExpense.customSplits).forEach(([k, v]) => { strMap[k] = v.toString(); });
        if (editingExpense.splitType === 'exact') setExactSplits(strMap);
        if (editingExpense.splitType === 'percentage') setPercentageSplits(strMap);
        if (editingExpense.splitType === 'shares') setShareWeights(editingExpense.customSplits);
      }
      if (editingExpense.itemizedItems) {
        setItemizedList(editingExpense.itemizedItems);
      }
      setTaxAmount(editingExpense.taxAmount ? editingExpense.taxAmount.toString() : '');
      setTipAmount(editingExpense.tipAmount ? editingExpense.tipAmount.toString() : '');
    } else if (activeTrip) {
      // New Expense Default
      setTitle('');
      setAmount('');
      setCurrency(activeTrip.baseCurrency || 'USD');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSplitType('equal');
      setIsMultiPayer(false);
      setPrimaryPayerId(currentUser?.id || activeTrip.members[0]?.userId || '');
      const allIds = activeTrip.members.map((m) => m.userId);
      setSelectedMemberIds(allIds);
      
      const defaultWeights: Record<string, number> = {};
      allIds.forEach((id) => { defaultWeights[id] = 1; });
      setShareWeights(defaultWeights);

      setItemizedList([
        { id: `item-${Date.now()}-1`, name: 'Shared Dish 1', amount: 0, assignedMemberIds: allIds }
      ]);
      setTaxAmount('');
      setTipAmount('');
    }
  }, [editingExpense, activeTrip, isAddExpenseOpen, currentUser]);

  if (!activeTrip) return null;

  const members = activeTrip.members;
  const numAmount = parseFloat(amount) || 0;

  // RBAC checks
  const canEdit = editingExpense
    ? rbacEngine.canEditExpense(activeRole, editingExpense.createdBy, currentUser?.id || '')
    : rbacEngine.canAddExpense(activeRole);

  const canDelete = editingExpense
    ? rbacEngine.canDeleteExpense(activeRole, editingExpense.createdBy, currentUser?.id || '')
    : false;

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numAmount <= 0) {
      alert('Please provide a title and valid amount');
      return;
    }

    // Build Payer Allocations
    let paidBy: PayerAllocation[] = [];
    if (isMultiPayer) {
      paidBy = members
        .map((m) => ({
          userId: m.userId,
          amount: parseFloat(multiPayers[m.userId] || '0') || 0,
        }))
        .filter((p) => p.amount > 0);

      const paidSum = paidBy.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(paidSum - numAmount) > 0.05) {
        alert(`Sum of multi-payers ($${paidSum.toFixed(2)}) must equal total amount ($${numAmount.toFixed(2)})`);
        return;
      }
    } else {
      paidBy = [{ userId: primaryPayerId || currentUser?.id || members[0].userId, amount: numAmount }];
    }

    // Build Custom Splits
    let customSplits: Record<string, number> | undefined;
    if (splitType === 'exact') {
      customSplits = {};
      selectedMemberIds.forEach((id) => {
        customSplits![id] = parseFloat(exactSplits[id] || '0') || 0;
      });
    } else if (splitType === 'percentage') {
      customSplits = {};
      selectedMemberIds.forEach((id) => {
        customSplits![id] = parseFloat(percentageSplits[id] || '0') || 0;
      });
    } else if (splitType === 'shares') {
      customSplits = shareWeights;
    }

    const payload = {
      tripId: activeTrip.id,
      title: title.trim(),
      category,
      amount: numAmount,
      currency,
      exchangeRate: currencyEngine.convertToBase(1, currency, activeTrip.baseCurrency),
      date,
      paidBy,
      splitType,
      splitWithMemberIds: selectedMemberIds,
      customSplits,
      itemizedItems: splitType === 'itemized' ? itemizedList : undefined,
      taxAmount: parseFloat(taxAmount) || 0,
      tipAmount: parseFloat(tipAmount) || 0,
      notes: notes.trim() || undefined,
      createdBy: editingExpense ? editingExpense.createdBy : currentUser?.id || 'guest',
    };

    if (editingExpense) {
      await updateExpense(editingExpense.id, payload);
    } else {
      await addExpense(payload);
    }

    triggerHaptic('success');
    closeAddExpense();
  };

  const handleDelete = async () => {
    if (editingExpense && window.confirm(`Delete expense "${editingExpense.title}"?`)) {
      await deleteExpense(editingExpense.id, activeTrip.id);
      triggerHaptic('warning');
      closeAddExpense();
    }
  };

  return (
    <Drawer open={isAddExpenseOpen} onOpenChange={(open: boolean) => !open && closeAddExpense()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="px-4 pb-2 pt-1 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <DrawerTitle className="text-base font-bold">
              {editingExpense ? 'Edit Expense' : 'New Travel Expense'}
            </DrawerTitle>
            <p className="text-[11px] text-muted-foreground">
              {activeTrip.name}
            </p>
          </div>

          {editingExpense && canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </DrawerHeader>

        <form onSubmit={handleSave} className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Amount & Currency Row */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                {SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || '$'}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-xl font-bold h-12 rounded-ios tracking-tight"
                required
              />
            </div>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-12 px-3 rounded-ios border border-input bg-zinc-100 dark:bg-zinc-800 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                type="text"
                placeholder="What was this for? (e.g. Shinkansen)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 text-xs rounded-ios"
                required
              />
            </div>
            <div>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-xs rounded-ios"
                required
              />
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setCategory(cat.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-ios text-[10px] font-semibold border transition-all active:scale-95 ${
                      isSelected
                        ? 'border-ios-blue bg-blue-500/10 text-ios-blue font-bold shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-muted-foreground'
                    }`}
                  >
                    {cat.icon}
                    <span className="mt-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payer Selector */}
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-ios p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Paid By
              </label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsMultiPayer(!isMultiPayer);
                }}
                className="text-[10px] font-bold text-ios-blue hover:underline"
              >
                {isMultiPayer ? 'Single Payer' : 'Multiple Payers'}
              </button>
            </div>

            {!isMultiPayer ? (
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                {members.map((member) => {
                  const isSelected = primaryPayerId === member.userId;
                  return (
                    <button
                      type="button"
                      key={member.userId}
                      onClick={() => {
                        triggerHaptic('light');
                        setPrimaryPayerId(member.userId);
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                        isSelected
                          ? 'border-ios-blue bg-ios-blue text-white shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-700 bg-card text-foreground'
                      }`}
                    >
                      <Avatar className="w-4 h-4 border-none">
                        <AvatarFallback style={{ backgroundColor: member.avatarColor }} className="text-[8px] text-white">
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5 mt-2">
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{member.name}</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={multiPayers[member.userId] || ''}
                      onChange={(e) =>
                        setMultiPayers({ ...multiPayers, [member.userId]: e.target.value })
                      }
                      className="w-24 h-8 text-xs text-right rounded-ios-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5-in-1 Split Mode Segmented Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Split Configuration
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {splitType.toUpperCase()}
              </span>
            </div>

            <Tabs value={splitType} onValueChange={(val) => setSplitType(val as SplitType)}>
              <TabsList className="grid grid-cols-5 w-full h-9">
                <TabsTrigger value="equal" className="text-[10px]">Equal</TabsTrigger>
                <TabsTrigger value="exact" className="text-[10px]">Exact</TabsTrigger>
                <TabsTrigger value="percentage" className="text-[10px]">%</TabsTrigger>
                <TabsTrigger value="shares" className="text-[10px]">Shares</TabsTrigger>
                <TabsTrigger value="itemized" className="text-[10px]">Receipt</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Split Mode Content Details */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-ios border border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5">
              {/* EQUAL SPLIT */}
              {splitType === 'equal' && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Select travelers sharing this cost evenly:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((member) => {
                      const isIncluded = selectedMemberIds.includes(member.userId);
                      return (
                        <button
                          type="button"
                          key={member.userId}
                          onClick={() => {
                            triggerHaptic('light');
                            if (isIncluded) {
                              if (selectedMemberIds.length > 1) {
                                setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.userId));
                              }
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, member.userId]);
                            }
                          }}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isIncluded
                              ? 'bg-ios-blue/15 border-ios-blue text-ios-blue'
                              : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] ${isIncluded ? 'bg-ios-blue' : 'bg-zinc-300'}`}>
                            {isIncluded ? '✓' : ''}
                          </div>
                          <span>{member.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                  {numAmount > 0 && selectedMemberIds.length > 0 && (
                    <div className="mt-2 text-right text-[11px] font-bold text-ios-blue">
                      ≈ {formatCurrency(numAmount / selectedMemberIds.length, currency)} / person
                    </div>
                  )}
                </div>
              )}

              {/* EXACT SPLIT */}
              {splitType === 'exact' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Assign exact amounts per person:</p>
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between text-xs">
                      <span>{member.name}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={exactSplits[member.userId] || ''}
                        onChange={(e) => setExactSplits({ ...exactSplits, [member.userId]: e.target.value })}
                        className="w-24 h-8 text-xs text-right rounded-ios-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* PERCENTAGE SPLIT */}
              {splitType === 'percentage' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Assign percentages (Total must equal 100%):</p>
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between text-xs">
                      <span>{member.name}</span>
                      <div className="flex items-center space-x-1">
                        <Input
                          type="number"
                          placeholder="25"
                          value={percentageSplits[member.userId] || ''}
                          onChange={(e) => setPercentageSplits({ ...percentageSplits, [member.userId]: e.target.value })}
                          className="w-16 h-8 text-xs text-right rounded-ios-sm"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SHARES SPLIT */}
              {splitType === 'shares' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Set weight per person (e.g. 1 share, 2 shares, 0.5):</p>
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between text-xs">
                      <span>{member.name}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = shareWeights[member.userId] || 1;
                            if (cur > 0.5) setShareWeights({ ...shareWeights, [member.userId]: cur - 0.5 });
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">{shareWeights[member.userId] || 1}x</span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = shareWeights[member.userId] || 1;
                            setShareWeights({ ...shareWeights, [member.userId]: cur + 0.5 });
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ITEMIZED RECEIPT BUILDER */}
              {splitType === 'itemized' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-muted-foreground">Receipt Dish / Items:</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        triggerHaptic('light');
                        setItemizedList([
                          ...itemizedList,
                          { id: `item-${Date.now()}`, name: `Item ${itemizedList.length + 1}`, amount: 0, assignedMemberIds: [members[0].userId] }
                        ]);
                      }}
                      className="h-7 text-[10px] px-2 rounded-full"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Dish
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {itemizedList.map((item, idx) => (
                      <div key={item.id} className="p-2.5 bg-card rounded-ios-sm border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="Dish name (e.g. Sushi)"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...itemizedList];
                              updated[idx].name = e.target.value;
                              setItemizedList(updated);
                            }}
                            className="h-8 text-xs flex-1 rounded-ios-sm"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount || ''}
                            onChange={(e) => {
                              const updated = [...itemizedList];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setItemizedList(updated);
                            }}
                            className="w-20 h-8 text-xs text-right rounded-ios-sm font-bold"
                          />
                          {itemizedList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setItemizedList(itemizedList.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Assign members to this item */}
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-muted-foreground mr-1">Who ate:</span>
                          {members.map((m) => {
                            const isAssigned = item.assignedMemberIds.includes(m.userId);
                            return (
                              <button
                                type="button"
                                key={m.userId}
                                onClick={() => {
                                  triggerHaptic('light');
                                  const updated = [...itemizedList];
                                  if (isAssigned) {
                                    updated[idx].assignedMemberIds = item.assignedMemberIds.filter((id) => id !== m.userId);
                                  } else {
                                    updated[idx].assignedMemberIds = [...item.assignedMemberIds, m.userId];
                                  }
                                  setItemizedList(updated);
                                }}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                  isAssigned
                                    ? 'bg-ios-blue text-white border-ios-blue'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-transparent'
                                }`}
                              >
                                {m.name.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tax & Tip Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Tax Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.target.value)}
                        className="h-8 text-xs rounded-ios-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Tip / Service</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="h-8 text-xs rounded-ios-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic text-center">
                    💡 Tax and tip are automatically apportioned proportionally based on each person's consumed subtotal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Input
              type="text"
              placeholder="Optional notes or receipt details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-ios"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="ios"
            size="lg"
            disabled={!canEdit}
            className="w-full text-sm font-bold shadow-md h-12"
          >
            {editingExpense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
