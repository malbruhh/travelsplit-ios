import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { triggerHaptic } from '../../lib/utils';
import { User as UserIcon, Shield, LogOut, KeyRound, Check, Palette, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PALETTES = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00', '#5856D6'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onOpenChange }) => {
  const { currentUser, activeRole, updateProfile, logout } = useAuthStore();
  const { setAuthModalOpen } = useUiStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || '#007AFF');
  const [defaultCurrency, setDefaultCurrency] = useState(currentUser?.defaultCurrency || 'USD');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    triggerHaptic('medium');

    try {
      await updateProfile({
        name: name.trim(),
        avatarColor,
        defaultCurrency,
        password: newPassword.trim() || undefined,
      });
      triggerHaptic('success');
      toast.success('Profile settings updated!');
      onOpenChange(false);
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    triggerHaptic('warning');
    await logout();
    toast.success('Logged out successfully');
    onOpenChange(false);
    setAuthModalOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-ios-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="w-10 h-10 ring-2 ring-ios-blue/30">
                <AvatarFallback style={{ backgroundColor: avatarColor }} className="text-white text-xs font-bold">
                  {name.slice(0, 2) || 'TS'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-sm font-bold">{currentUser?.name}</DialogTitle>
                <DialogDescription className="text-[11px]">{currentUser?.email}</DialogDescription>
              </div>
            </div>
            <Badge variant="iosBlue" className="text-[10px] capitalize">
              {activeRole}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Display Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-ios"
              required
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-ios-blue" />
              Theme Avatar Color
            </label>
            <div className="flex items-center space-x-2">
              {PALETTES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAvatarColor(color);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    avatarColor === color ? 'ring-2 ring-offset-2 ring-ios-blue scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {avatarColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-ios-blue" />
              Default Base Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-background border border-input rounded-ios focus:ring-1 focus:ring-ios-blue"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
              <option value="SGD">SGD ($)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-ios-blue" />
              Change Password (Optional)
            </label>
            <Input
              type="password"
              placeholder="Leave blank to keep unchanged"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 text-xs rounded-ios"
            />
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              variant="ios"
              size="lg"
              disabled={isLoading}
              className="w-full text-xs font-bold h-10 shadow-sm"
            >
              {isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleLogout}
              className="w-full text-xs font-bold h-10 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out of Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
