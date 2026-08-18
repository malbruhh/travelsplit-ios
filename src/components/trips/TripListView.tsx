import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettlementStore } from '../../store/useSettlementStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { analyticsEngine } from '../../core/analyticsEngine';
import { formatCurrency, formatDate, triggerHaptic } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { JoinTripModal } from './JoinTripModal';
import { Plus, MapPin, Calendar, Users, Wallet, CheckCircle2, ChevronRight, Sparkles, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const TripListView: React.FC = () => {
  const { trips, activeTrip, selectTrip } = useTripStore();
  const { expenses } = useExpenseStore();
  const { settlements } = useSettlementStore();
  const { currentUser } = useAuthStore();
  const { setCreateTripOpen, setActiveTab, setMemberModalOpen } = useUiStore();

  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const tripSummary = analyticsEngine.calculateTripSummary(expenses);
  const mySpending = currentUser
    ? analyticsEngine.calculateIndividualSpending(currentUser.id, expenses, settlements)
    : null;

  const budgetProgress = activeTrip?.totalBudget
    ? Math.min(Math.round((tripSummary.totalSpent / activeTrip.totalBudget) * 100), 100)
    : 0;

  const handleCopyJoinCode = () => {
    if (activeTrip?.joinCode) {
      triggerHaptic('light');
      navigator.clipboard.writeText(activeTrip.joinCode);
      setCopiedCode(true);
      toast.success(`Invite code ${activeTrip.joinCode} copied!`);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Active Trip Hero Card */}
      {activeTrip && (
        <div className="relative overflow-hidden rounded-ios-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-5 shadow-ios-float">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center space-x-1 text-[11px] font-medium bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span>Active Expedition</span>
                  </span>

                  {activeTrip.joinCode && (
                    <button
                      onClick={handleCopyJoinCode}
                      className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full transition-colors active:scale-95"
                    >
                      <span>Code: {activeTrip.joinCode}</span>
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-white/80" />}
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight">{activeTrip.name}</h2>
                <div className="flex items-center space-x-3 text-xs text-white/80 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeTrip.destination}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(activeTrip.startDate)} - {formatDate(activeTrip.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/20">
              <div className="bg-black/20 backdrop-blur-xs rounded-ios-sm p-2.5">
                <span className="text-[10px] uppercase font-semibold text-white/70 tracking-wider">Group Total</span>
                <p className="text-lg font-bold">
                  {formatCurrency(tripSummary.totalSpent, activeTrip.baseCurrency)}
                </p>
                <span className="text-[10px] text-white/60">{tripSummary.expenseCount} logged expenses</span>
              </div>

              <div className="bg-black/20 backdrop-blur-xs rounded-ios-sm p-2.5">
                <span className="text-[10px] uppercase font-semibold text-white/70 tracking-wider">My Consumption</span>
                <p className="text-lg font-bold text-emerald-300">
                  {mySpending ? formatCurrency(mySpending.summary.totalConsumed, activeTrip.baseCurrency) : '$0.00'}
                </p>
                <span className="text-[10px] text-white/60">
                  {mySpending && mySpending.summary.netBalance >= 0
                    ? `+${formatCurrency(mySpending.summary.netBalance, activeTrip.baseCurrency)} owed`
                    : `${mySpending ? formatCurrency(mySpending.summary.netBalance, activeTrip.baseCurrency) : '$0'} debt`}
                </span>
              </div>
            </div>

            {/* Budget Progress Bar */}
            {activeTrip.totalBudget && activeTrip.totalBudget > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-white/80 mb-1">
                  <span>Trip Budget Usage</span>
                  <span>{budgetProgress}% of {formatCurrency(activeTrip.totalBudget, activeTrip.baseCurrency)}</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      budgetProgress > 90 ? 'bg-red-400' : budgetProgress > 70 ? 'bg-amber-300' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Member Avatars Row */}
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setMemberModalOpen(true);
                }}
                className="flex items-center space-x-2 group"
              >
                <div className="flex -space-x-2">
                  {activeTrip.members.slice(0, 4).map((member) => (
                    <Avatar key={member.userId} className="w-7 h-7 ring-2 ring-white/80">
                      <AvatarFallback style={{ backgroundColor: member.avatarColor }} className="text-[10px] text-white">
                        {member.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-white/90 group-hover:underline">
                  {activeTrip.members.length} Travelers
                </span>
              </button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('expenses');
                }}
                className="text-xs h-8 bg-white text-blue-900 hover:bg-white/90 rounded-full px-3"
              >
                View Ledger
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trips Switcher Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">All Trips</h3>
          <div className="flex items-center space-x-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                triggerHaptic('light');
                setJoinModalOpen(true);
              }}
              className="h-8 text-xs rounded-full px-3"
            >
              <QrCode className="w-3.5 h-3.5 mr-1 text-ios-blue" />
              Join Code
            </Button>

            <Button
              size="sm"
              variant="ios"
              onClick={() => {
                triggerHaptic('medium');
                setCreateTripOpen(true);
              }}
              className="h-8 text-xs rounded-full px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Trip
            </Button>
          </div>
        </div>

        <div className="space-y-2.5">
          {trips.map((trip) => {
            const isSelected = trip.id === activeTrip?.id;
            return (
              <Card
                key={trip.id}
                onClick={() => {
                  triggerHaptic('light');
                  selectTrip(trip.id);
                }}
                className={`cursor-pointer transition-all hover:border-ios-blue active:scale-[0.99] ${
                  isSelected
                    ? 'border-ios-blue bg-blue-500/5 ring-1 ring-ios-blue'
                    : 'bg-card'
                }`}
              >
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-ios-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg">
                      ✈️
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-foreground">{trip.name}</h4>
                        {isSelected && (
                          <Badge variant="iosBlue" className="text-[9px] px-1.5 py-0 h-4">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {trip.destination} • {trip.members.length} members
                        {trip.joinCode && <span className="font-mono font-bold text-[10px]">({trip.joinCode})</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {trip.baseCurrency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <JoinTripModal open={isJoinModalOpen} onOpenChange={setJoinModalOpen} />
    </div>
  );
};
