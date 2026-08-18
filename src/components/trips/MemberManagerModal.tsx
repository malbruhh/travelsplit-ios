import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { rbacEngine } from '../../core/rbacEngine';
import type { TripRole } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { triggerHaptic } from '../../lib/utils';
import { Users, UserPlus, Shield, Trash2, Crown } from 'lucide-react';

export const MemberManagerModal: React.FC = () => {
  const { isMemberModalOpen, setMemberModalOpen } = useUiStore();
  const { activeTrip, addMember, updateMemberRole, removeMember } = useTripStore();
  const { activeRole, currentUser } = useAuthStore();

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<TripRole>('editor');

  if (!activeTrip) return null;

  const isOwner = rbacEngine.canManageMembers(activeRole);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    triggerHaptic('success');
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    await addMember(activeTrip.id, {
      userId: `member-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      avatarColor: randomColor,
      defaultWeight: 1,
    });

    setNewName('');
  };

  const handleRoleChange = async (userId: string, role: TripRole) => {
    triggerHaptic('light');
    await updateMemberRole(activeTrip.id, userId, role);
  };

  const handleRemove = async (userId: string, name: string) => {
    if (activeTrip.members.length <= 1) {
      alert('Trip must have at least 1 member');
      return;
    }
    if (window.confirm(`Remove ${name} from this trip?`)) {
      triggerHaptic('warning');
      await removeMember(activeTrip.id, userId);
    }
  };

  return (
    <Dialog open={isMemberModalOpen} onOpenChange={setMemberModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-ios-blue" />
            Trip Members & Roles ({activeTrip.members.length})
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage who is traveling and their access control permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          {activeTrip.members.map((m) => {
            const isSelf = currentUser?.id === m.userId;
            return (
              <div
                key={m.userId}
                className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-850 rounded-ios border border-zinc-200 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback style={{ backgroundColor: m.avatarColor }} className="text-xs text-white font-bold">
                      {m.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-foreground truncate">{m.name}</span>
                      {isSelf && <span className="text-[10px] text-muted-foreground">(You)</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Default Share: {m.defaultWeight || 1}x</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isOwner ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value as TripRole)}
                      className="h-7 px-2 text-[11px] font-bold rounded-md border border-input bg-card"
                    >
                      <option value="owner">Trip Owner</option>
                      <option value="editor">Editor (Member)</option>
                      <option value="viewer">Viewer (Guest)</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rbacEngine.getRoleBadgeClass(m.role)}`}>
                      {rbacEngine.getRoleLabel(m.role)}
                    </span>
                  )}

                  {isOwner && activeTrip.members.length > 1 && (
                    <button
                      onClick={() => handleRemove(m.userId, m.name)}
                      className="text-zinc-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Member Form (Owner only) */}
          {isOwner ? (
            <form onSubmit={handleAddMember} className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase block">
                Add New Traveler to Trip
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Traveler Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 text-xs flex-1"
                  required
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TripRole)}
                  className="h-9 px-2 text-xs font-semibold rounded-ios border border-input bg-card"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button type="submit" variant="ios" size="sm" className="h-9 text-xs font-bold px-3">
                  Add
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-[11px] text-muted-foreground italic text-center pt-2">
              🔒 Only the Trip Owner ({activeTrip.members.find(m => m.role === 'owner')?.name || 'Owner'}) can add members or modify roles.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
