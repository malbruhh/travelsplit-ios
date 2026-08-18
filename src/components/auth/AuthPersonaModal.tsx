import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { useUiStore } from '../../store/useUiStore';
import { rbacEngine } from '../../core/rbacEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { SUPPORTED_CURRENCIES } from '../../core/currencyEngine';
import { triggerHaptic } from '../../lib/utils';
import { UserCheck, UserPlus, Shield } from 'lucide-react';

export const AuthPersonaModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useUiStore();
  const { currentUser, allUsers, switchUser, register, activeRole } = useAuthStore();
  const { activeTrip } = useTripStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSwitch = async (userId: string) => {
    triggerHaptic('medium');
    await switchUser(userId);
    // update role in current trip
    if (activeTrip) {
      const member = activeTrip.members.find((m) => m.userId === userId);
      useAuthStore.getState().setActiveRole(member ? member.role : 'viewer');
    }
    setAuthModalOpen(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    triggerHaptic('success');
    const newUser = await register(name.trim(), email.trim(), currency);
    // If active trip exists, add user as editor
    if (activeTrip) {
      await useTripStore.getState().addMember(activeTrip.id, {
        userId: newUser.id,
        name: newUser.name,
        role: 'editor',
        avatarColor: newUser.avatarColor,
        defaultWeight: 1,
        email: newUser.email,
      });
    }

    setIsRegisterMode(false);
    setAuthModalOpen(false);
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-ios-blue" />
            {isRegisterMode ? 'Register New Traveler' : 'Switch Traveler Persona'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isRegisterMode
              ? 'Create a new user profile and join the trip.'
              : 'Experience the app from any group member’s perspective with their specific RBAC permissions.'}
          </DialogDescription>
        </DialogHeader>

        {!isRegisterMode ? (
          <div className="space-y-2 py-2">
            {allUsers.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              const tripMember = activeTrip?.members.find((m) => m.userId === user.id);
              const userRole = tripMember ? tripMember.role : 'viewer';
              const roleLabel = rbacEngine.getRoleLabel(userRole);
              const roleBadge = rbacEngine.getRoleBadgeClass(userRole);

              return (
                <button
                  key={user.id}
                  onClick={() => handleSwitch(user.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-ios border transition-all text-left active:scale-[0.98] ${
                    isCurrent
                      ? 'border-ios-blue bg-blue-500/10 ring-1 ring-ios-blue'
                      : 'border-zinc-200 dark:border-zinc-800 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback style={{ backgroundColor: user.avatarColor }} className="text-xs text-white font-bold">
                        {user.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{user.name}</h4>
                      <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleBadge}`}>
                      {roleLabel}
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  triggerHaptic('light');
                  setIsRegisterMode(true);
                }}
                className="w-full text-xs h-9 rounded-ios"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Register New Traveler
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Maya Lin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="maya@travelsplit.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 rounded-ios border border-input bg-card text-xs font-semibold"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsRegisterMode(false)}
                className="flex-1 text-xs h-9"
              >
                Back
              </Button>
              <Button type="submit" variant="ios" size="sm" className="flex-1 text-xs h-9 font-bold">
                Create & Join
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
