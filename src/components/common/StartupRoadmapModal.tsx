import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, Circle, ShieldCheck, KeyRound, Layout, ArrowRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

export const StartupRoadmapModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has dismissed startup roadmap for this session
    const hasSeen = sessionStorage.getItem('travelsplit_roadmap_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    triggerHaptic('light');
    sessionStorage.setItem('travelsplit_roadmap_seen', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-ios-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-full bg-ios-blue/15 text-ios-blue">
              <Sparkles className="w-4 h-4" />
            </span>
            <DialogTitle className="text-base font-bold">
              Development Roadmap & Next Tasks
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Current state saved. Next planned milestones for upcoming implementation:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Milestone 1 */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-ios border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-foreground">
                <Layout className="w-4 h-4 text-ios-blue" />
                <span>1. Frontend Authentication Interface</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-ios-blue border-blue-500/20">
                To-Do
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Dedicated iOS Login & Registration screens with form validation, password strength meters, and account switching.
            </p>
          </div>

          {/* Milestone 2 */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-ios border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-foreground">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span>2. Dual-Token Authentication System</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                To-Do
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Short-lived JWT Access Tokens (15 min) + secure Refresh Tokens with automatic token rotation on API 401 errors.
            </p>
          </div>

          {/* Milestone 3 */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-ios border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>3. Enterprise Security & Middleware Checks</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                To-Do
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              JWT authentication middleware on all private API endpoints, rate limiting, password hashing (bcrypt), and CSRF protection.
            </p>
          </div>
        </div>

        <Button
          variant="ios"
          size="lg"
          onClick={handleClose}
          className="w-full text-xs font-bold h-11 shadow-sm"
        >
          Got it, Proceed to App
        </Button>
      </DialogContent>
    </Dialog>
  );
};
