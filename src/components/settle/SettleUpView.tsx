import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettlementStore } from '../../store/useSettlementStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { debtEngine } from '../../core/debtEngine';
import { rbacEngine } from '../../core/rbacEngine';
import { formatCurrency, formatDate, triggerHaptic } from '../../lib/utils';
import type { PaymentMethod } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { ArrowRight, CheckCircle2, ArrowLeftRight, CreditCard, Sparkles, Trash2, History } from 'lucide-react';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'venmo', label: 'Venmo', icon: '📱' },
  { id: 'revolut', label: 'Revolut', icon: '💳' },
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export const SettleUpView: React.FC = () => {
  const { activeTrip } = useTripStore();
  const { expenses } = useExpenseStore();
  const { settlements, recordSettlement, deleteSettlement } = useSettlementStore();
  const { currentUser, activeRole } = useAuthStore();
  const { isSettleModalOpen, openSettleModal, closeSettleModal, suggestedSettlementTransfer } = useUiStore();

  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('venmo');
  const [notes, setNotes] = useState('');

  if (!activeTrip) return null;

  const members = activeTrip.members;
  const balances = debtEngine.calculateBalances(members, expenses, settlements);
  const transfers = debtEngine.simplifyDebts(balances);

  const canRecord = rbacEngine.canRecordSettlement(activeRole);

  const handleOpenSettle = (transfer?: { fromUserId: string; toUserId: string; amount: number }) => {
    if (!canRecord) {
      alert('Viewers cannot record settlements');
      return;
    }
    if (transfer) {
      setFromUserId(transfer.fromUserId);
      setToUserId(transfer.toUserId);
      setAmount(transfer.amount.toString());
    } else {
      setFromUserId(members[0]?.userId || '');
      setToUserId(members[1]?.userId || '');
      setAmount('');
    }
    setPaymentMethod('venmo');
    setNotes('');
    openSettleModal(transfer);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!fromUserId || !toUserId || !numAmount || numAmount <= 0) {
      alert('Please fill in all settlement fields');
      return;
    }
    if (fromUserId === toUserId) {
      alert('Payer and receiver cannot be the same person');
      return;
    }

    await recordSettlement({
      tripId: activeTrip.id,
      fromUserId,
      toUserId,
      amount: numAmount,
      currency: activeTrip.baseCurrency,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    closeSettleModal();
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-ios-lg p-4 text-white shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Debt Simplification Hub</span>
          </div>
          <h3 className="text-base font-black mt-1">Optimal Group Settlement</h3>
          <p className="text-[11px] text-emerald-100/90 mt-0.5">
            {transfers.length === 0
              ? '🎉 All debts are fully settled!'
              : `Minimized to ${transfers.length} direct transfers.`}
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenSettle()}
          disabled={!canRecord}
          className="h-8 text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 rounded-full px-3"
        >
          Record Settle
        </Button>
      </div>

      {/* Suggested Minimal Transfers Section */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <ArrowLeftRight className="w-4 h-4 text-ios-blue" />
          Who Pays Whom
        </h4>

        {transfers.length === 0 ? (
          <div className="text-center py-8 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-ios p-4 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h5 className="text-sm font-bold text-foreground">Zero Outstanding Debts</h5>
            <p className="text-xs text-muted-foreground">Everyone in the group is squared away!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, idx) => {
              const fromMember = members.find((m) => m.userId === t.fromUserId);
              const toMember = members.find((m) => m.userId === t.toUserId);
              const isMeDebtor = currentUser?.id === t.fromUserId;
              const isMeCreditor = currentUser?.id === t.toUserId;

              return (
                <Card
                  key={idx}
                  className={`border transition-all ${
                    isMeDebtor
                      ? 'border-orange-500/40 bg-orange-500/5'
                      : isMeCreditor
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'bg-card'
                  }`}
                >
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      {/* From Member Avatar */}
                      <Avatar className="w-7 h-7">
                        <AvatarFallback style={{ backgroundColor: fromMember?.avatarColor }} className="text-[9px] text-white">
                          {fromMember?.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex items-center space-x-1.5 text-xs font-bold">
                        <span className={isMeDebtor ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}>
                          {fromMember?.name.split(' ')[0]}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={isMeCreditor ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}>
                          {toMember?.name.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-black text-foreground">
                        {formatCurrency(t.amount, activeTrip.baseCurrency)}
                      </span>

                      <Button
                        size="sm"
                        variant="ios"
                        onClick={() => handleOpenSettle(t)}
                        disabled={!canRecord}
                        className="h-7 text-[11px] px-2.5 rounded-full"
                      >
                        Settle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Raw Balances Grid */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-ios-blue" />
          Member Net Balances
        </h4>

        <div className="space-y-1.5">
          {members.map((member) => {
            const bal = balances[member.userId] || 0;
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-2.5 bg-card rounded-ios border border-zinc-200/70 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback style={{ backgroundColor: member.avatarColor }} className="text-[9px] text-white">
                      {member.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground">{member.name}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black ${
                      bal > 0 ? 'text-emerald-600 dark:text-emerald-400' : bal < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'
                    }`}
                  >
                    {bal > 0 ? `+${formatCurrency(bal, activeTrip.baseCurrency)}` : bal < 0 ? formatCurrency(bal, activeTrip.baseCurrency) : '$0.00'}
                  </span>
                  <span className="block text-[9px] text-muted-foreground">
                    {bal > 0 ? 'is owed' : bal < 0 ? 'owes group' : 'settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <History className="w-4 h-4 text-ios-blue" />
            Settlement History ({settlements.length})
          </h4>

          <div className="space-y-1.5">
            {settlements.map((s) => {
              const fromM = members.find((m) => m.userId === s.fromUserId);
              const toM = members.find((m) => m.userId === s.toUserId);
              return (
                <div key={s.id} className="flex items-center justify-between p-2 bg-zinc-100/50 dark:bg-zinc-800/40 rounded-ios-sm text-xs">
                  <div>
                    <span className="font-medium text-foreground">
                      {fromM?.name.split(' ')[0]} paid {toM?.name.split(' ')[0]}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {formatDate(s.date)} via {s.paymentMethod.toUpperCase()} {s.notes ? `• ${s.notes}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.amount, s.currency)}
                    </span>
                    {canRecord && (
                      <button
                        onClick={() => deleteSettlement(s.id, activeTrip.id)}
                        className="text-zinc-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record Settlement Modal Bottom Sheet */}
      <Drawer open={isSettleModalOpen} onOpenChange={(open: boolean) => !open && closeSettleModal()}>
        <DrawerContent>
          <DrawerHeader className="px-4 pb-2 pt-1 border-b border-zinc-100 dark:border-zinc-800">
            <DrawerTitle className="text-base font-bold">Record Settle-Up Payment</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleRecordSubmit} className="p-4 space-y-4 max-w-lg mx-auto">
            {/* Amount */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Settlement Amount ({activeTrip.baseCurrency})
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xl font-bold h-12 rounded-ios"
                required
              />
            </div>

            {/* Payer & Receiver Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Who Paid?
                </label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full h-10 px-3 rounded-ios border border-input bg-card text-xs font-semibold"
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Paid To?
                </label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full h-10 px-3 rounded-ios border border-input bg-card text-xs font-semibold"
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector Pills */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setPaymentMethod(pm.id);
                      }}
                      className={`flex items-center justify-center space-x-1.5 p-2 rounded-ios text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground'
                      }`}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <Input
                type="text"
                placeholder="Notes (e.g. Venmo transaction ID)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 text-xs rounded-ios"
              />
            </div>

            <Button type="submit" variant="ios" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-sm font-bold shadow-md">
              Confirm Settlement
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
