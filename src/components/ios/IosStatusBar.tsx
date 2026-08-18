import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

export const IosStatusBar: React.FC = () => {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold select-none text-foreground">
      <span>{time}</span>
      <div className="flex items-center space-x-2">
        <div className="flex space-x-0.5 items-end h-2.5">
          <div className="w-0.5 h-1 bg-current rounded-full" />
          <div className="w-0.5 h-1.5 bg-current rounded-full" />
          <div className="w-0.5 h-2 bg-current rounded-full" />
          <div className="w-0.5 h-2.5 bg-current rounded-full" />
        </div>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center space-x-0.5">
          <Battery className="w-4 h-4 fill-current" />
        </div>
      </div>
    </div>
  );
};
