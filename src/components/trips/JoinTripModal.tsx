import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { api } from '../../services/api';
import { syncService } from '../../services/syncService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { triggerHaptic } from '../../lib/utils';
import { QrCode, Sparkles, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface JoinTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinTripModal: React.FC<JoinTripModalProps> = ({ open, onOpenChange }) => {
  const { currentUser } = useAuthStore();
  const { initializeTrips, selectTrip } = useTripStore();
  const { setActiveTab } = useUiStore();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewTrip, setPreviewTrip] = useState<any | null>(null);

  const handleCodeChange = async (val: string) => {
    const formatted = val.toUpperCase().trim();
    setCode(formatted);

    if (formatted.length >= 4) {
      try {
        const trip = await api.getTripByCode(formatted);
        setPreviewTrip(trip);
      } catch {
        setPreviewTrip(null);
      }
    } else {
      setPreviewTrip(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !currentUser) return;

    setIsLoading(true);
    triggerHaptic('medium');

    try {
      const trip = await api.joinTripByCode(code.trim(), currentUser);
      await syncService.syncTripFromRemote(trip.id);
      await initializeTrips();
      await selectTrip(trip.id);

      triggerHaptic('success');
      toast.success(`Joined trip "${trip.name}"!`);
      onOpenChange(false);
      setActiveTab('expenses');
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.message || 'Failed to join trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-ios-blue" />
            Join Trip with Code
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter the 6-character trip invite code shared by the trip leader.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleJoin} className="space-y-3.5 py-2">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1 text-center">
              Invite / Join Code
            </label>
            <Input
              type="text"
              placeholder="e.g. SAKURA"
              maxLength={8}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="h-12 text-center text-xl font-mono font-black uppercase tracking-widest rounded-ios"
              required
            />
          </div>

          {/* Trip Preview Card if found */}
          {previewTrip && (
            <Card className="border-ios-blue bg-blue-500/10 p-3 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center space-x-1.5 font-bold text-ios-blue">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trip Found!</span>
              </div>
              <h4 className="font-bold text-sm text-foreground">{previewTrip.name}</h4>
              <div className="flex items-center space-x-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {previewTrip.destination}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {previewTrip.members?.length || 1} members
                </span>
              </div>
            </Card>
          )}

          <Button
            type="submit"
            variant="ios"
            size="lg"
            disabled={isLoading || !code}
            className="w-full text-xs font-bold h-11 shadow-sm"
          >
            {isLoading ? 'Joining...' : 'Join & Sync Trip'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
