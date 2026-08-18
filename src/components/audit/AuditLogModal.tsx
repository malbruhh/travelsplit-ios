import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useUiStore } from '../../store/useUiStore';
import { auditRepository } from '../../db/repositories/auditRepository';
import type { AuditLog } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { formatTimeAgo } from '../../lib/utils';
import { Shield, Activity, Clock } from 'lucide-react';

export const AuditLogModal: React.FC = () => {
  const { isAuditModalOpen, setAuditModalOpen } = useUiStore();
  const { activeTrip } = useTripStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (activeTrip && isAuditModalOpen) {
      auditRepository.getByTripId(activeTrip.id).then(setLogs);
    }
  }, [activeTrip, isAuditModalOpen]);

  if (!activeTrip) return null;

  return (
    <Dialog open={isAuditModalOpen} onOpenChange={setAuditModalOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-ios-blue" />
            Enterprise Audit Trail
          </DialogTitle>
          <DialogDescription className="text-xs">
            Immutable log of all user actions, expense modifications, role changes, and settlements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {logs.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-6">No audit records found.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-ios border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{log.userName}</span>
                  <div className="flex items-center space-x-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(log.timestamp)}</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-[11px]">{log.details}</p>

                <div className="pt-0.5">
                  <span className="text-[9px] font-mono uppercase bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-bold">
                    {log.action}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
