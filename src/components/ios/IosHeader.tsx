import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { useUiStore } from '../../store/useUiStore';
import { rbacEngine } from '../../core/rbacEngine';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ChevronDown, Share2, Shield, LogIn, Users, User } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

export const IosHeader: React.FC = () => {
  const { currentUser, activeRole } = useAuthStore();
  const { activeTrip } = useTripStore();
  const { setExportModalOpen, setAuditModalOpen, setProfileModalOpen, setMemberModalOpen } = useUiStore();

  const roleLabel = rbacEngine.getRoleLabel(activeRole);
  const roleBadgeClass = rbacEngine.getRoleBadgeClass(activeRole);

  return (
    <header className="sticky top-0 z-30 ios-glass border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Persona Switcher & Profile Pill */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setProfileModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded-full px-2.5 py-1 transition-all active:scale-[0.97]"
        >
          <Avatar className="w-6 h-6 border-none">
            <AvatarFallback
              style={{ backgroundColor: currentUser?.avatarColor || '#007AFF' }}
              className="text-[10px] text-white"
            >
              {currentUser?.name ? currentUser.name.slice(0, 2) : 'ME'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-1.5 text-left">
            <span className="text-xs font-semibold max-w-[100px] truncate">
              {currentUser ? currentUser.name.split(' ')[0] : 'Guest'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </button>

        {/* Center: Role Indicator */}
        <div className="flex items-center space-x-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
            {roleLabel}
          </span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setMemberModalOpen(true);
            }}
            title="Trip Members & Roles"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              triggerHaptic('light');
              setExportModalOpen(true);
            }}
            title="Export Summary Report"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setAuditModalOpen(true);
            }}
            title="Audit Log"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trip Subtitle */}
      {activeTrip && (
        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/40 text-[11px] text-muted-foreground">
          <span className="truncate font-medium flex items-center gap-1">
            <span>✈️</span> {activeTrip.name}
          </span>
          <span className="shrink-0 font-mono font-semibold bg-zinc-200/60 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px]">
            {activeTrip.baseCurrency}
          </span>
        </div>
      )}
    </header>
  );
};
