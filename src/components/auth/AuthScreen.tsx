import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { triggerHaptic } from '../../lib/utils';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plane,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

interface AuthScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ open, onOpenChange }) => {
  const { currentUser, login, register, switchUser, allUsers } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string): { label: string; color: string; percent: number } => {
    if (!pass) return { label: 'Empty', color: 'bg-zinc-200 dark:bg-zinc-800', percent: 0 };
    if (pass.length < 6) return { label: 'Too short', color: 'bg-red-500', percent: 25 };
    if (pass.length < 8) return { label: 'Fair', color: 'bg-amber-500', percent: 50 };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { label: 'Strong', color: 'bg-emerald-500', percent: 100 };
    return { label: 'Good', color: 'bg-blue-500', percent: 75 };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    try {
      if (mode === 'login') {
        const success = await login(email.trim(), password || undefined);
        if (success) {
          triggerHaptic('success');
          toast.success(`Welcome back!`);
          onOpenChange(false);
        } else {
          triggerHaptic('error');
          toast.error('Account not found or password incorrect');
        }
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        await register(name.trim(), email.trim(), password || undefined, defaultCurrency);
        triggerHaptic('success');
        toast.success(`Account created! Welcome to TravelSplit.`);
        onOpenChange(false);
      }
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string, userName: string) => {
    triggerHaptic('light');
    await switchUser(userId);
    toast.success(`Switched active profile to ${userName}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-ios-lg p-5">
        <DialogHeader className="text-center space-y-1.5 pb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md">
            <Plane className="w-6 h-6 transform -rotate-45" />
          </div>
          <DialogTitle className="text-lg font-bold">
            {mode === 'login' ? 'Sign In to TravelSplit' : 'Create Traveler Account'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === 'login'
              ? 'Access shared trip ledgers, live expense sync & debts'
              : 'Join travel groups, split itemized meals & track spending'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex rounded-full bg-zinc-100 dark:bg-zinc-800 p-1 mb-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('login');
            }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-all ${
              mode === 'login' ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('register');
            }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-all ${
              mode === 'register' ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-ios"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 text-xs rounded-ios"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Password</label>
              {mode === 'login' && (
                <span className="text-[10px] text-ios-blue hover:underline cursor-pointer">Forgot?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs rounded-ios"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength indicator for registration */}
            {mode === 'register' && password && (
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Strength</span>
                  <span className="font-medium">{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Default Currency</label>
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
          )}

          <Button
            type="submit"
            variant="ios"
            size="lg"
            disabled={isLoading}
            className="w-full text-xs font-bold h-11 shadow-sm mt-2"
          >
            {isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Quick Demo Personas
            </span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
              Instant
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {allUsers.slice(0, 4).map((user) => {
              const isActive = currentUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickSwitch(user.id, user.name)}
                  className={`flex items-center space-x-2 p-2 rounded-ios border text-left transition-all active:scale-98 ${
                    isActive
                      ? 'border-ios-blue bg-blue-500/10 text-foreground ring-1 ring-ios-blue'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 text-foreground'
                  }`}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback style={{ backgroundColor: user.avatarColor }} className="text-[9px] text-white">
                      {user.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold truncate leading-none">{user.name}</p>
                    <span className="text-[9px] text-muted-foreground truncate block mt-0.5">
                      {user.id === 'user-alex' ? 'Trip Owner' : 'Member'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
