import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { SUPPORTED_CURRENCIES } from '../../core/currencyEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { triggerHaptic } from '../../lib/utils';
import { Compass } from 'lucide-react';

export const CreateTripModal: React.FC = () => {
  const { isCreateTripOpen, setCreateTripOpen, setActiveTab } = useUiStore();
  const { createTrip } = useTripStore();
  const { currentUser } = useAuthStore();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [totalBudget, setTotalBudget] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !destination.trim() || !currentUser) return;

    triggerHaptic('success');
    await createTrip({
      name: name.trim(),
      destination: destination.trim(),
      baseCurrency,
      startDate,
      endDate,
      createdBy: currentUser.id,
      archived: false,
      totalBudget: parseFloat(totalBudget) || undefined,
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          role: 'owner',
          avatarColor: currentUser.avatarColor,
          defaultWeight: 1,
          email: currentUser.email,
        }
      ]
    });

    setCreateTripOpen(false);
    setActiveTab('expenses');
  };

  return (
    <Dialog open={isCreateTripOpen} onOpenChange={setCreateTripOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-ios-blue" />
            Create New Trip
          </DialogTitle>
          <DialogDescription className="text-xs">
            Start a new travel expedition with your friends or family.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Trip Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Bali Summer Getaway 🌴"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Destination
            </label>
            <Input
              type="text"
              placeholder="e.g. Bali, Indonesia"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Base Currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full h-9 px-3 rounded-ios border border-input bg-card text-xs font-semibold"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Total Budget (Optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 3000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <Button type="submit" variant="ios" size="lg" className="w-full text-xs font-bold h-10 mt-2">
            Create Trip
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
