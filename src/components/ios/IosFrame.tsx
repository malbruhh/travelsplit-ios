import React, { useState, useEffect } from 'react';
import { IosStatusBar } from './IosStatusBar';
import { IosHeader } from './IosHeader';
import { IosBottomTabBar } from './IosBottomTabBar';
import { useUiStore } from '../../store/useUiStore';
import { useTripStore } from '../../store/useTripStore';
import { Smartphone, Monitor, Sun, Moon, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../../lib/utils';

interface IosFrameProps {
  children: React.ReactNode;
}

export const IosFrame: React.FC<IosFrameProps> = ({ children }) => {
  const { isMobilePreviewFrame, toggleMobilePreviewFrame } = useUiStore();
  const { resetToSeedData } = useTripStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-zinc-950/90 text-foreground flex flex-col items-center justify-center p-0 sm:p-4 transition-colors font-sans">
      {/* Top Floating Control Bar for Demo / Testing */}
      <div className="w-full max-w-md mb-2 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 rounded-full shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-200">TravelSplit iOS</span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.2 rounded">v1.0-prod</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset Demo Data */}
          <button
            onClick={async () => {
              if (window.confirm('Reset all demo data to fresh seed state?')) {
                triggerHaptic('medium');
                await resetToSeedData();
              }
            }}
            title="Reset to Demo Data"
            className="p-1 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsDark(!isDark);
            }}
            title="Toggle Light/Dark Theme"
            className="p-1 hover:text-white transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Frame Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              toggleMobilePreviewFrame();
            }}
            title="Toggle Mobile Viewport Frame"
            className="p-1 hover:text-white transition-colors"
          >
            {isMobilePreviewFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full bg-background flex flex-col transition-all overflow-hidden ${
          isMobilePreviewFrame
            ? 'max-w-[412px] h-[890px] rounded-[48px] shadow-[0_0_0_12px_#1c1c1e,0_20px_50px_rgba(0,0,0,0.6)] border border-zinc-800 relative'
            : 'max-w-2xl min-h-screen sm:min-h-[90vh] sm:rounded-2xl sm:border sm:border-zinc-800 shadow-xl'
        }`}
      >
        {/* Dynamic Island on Mobile Frame */}
        {isMobilePreviewFrame && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
          </div>
        )}

        {/* Status Bar */}
        <IosStatusBar />

        {/* Frosted Header */}
        <IosHeader />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-6 bg-zinc-50 dark:bg-black">
          {children}
        </main>

        {/* Persistent Bottom Tab Bar */}
        <IosBottomTabBar />
      </div>
    </div>
  );
};
