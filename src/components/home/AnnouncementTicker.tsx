import React, { useState } from 'react';
import { Volume2, ArrowRight, X } from 'lucide-react';
import { Announcement } from '../../types';

interface AnnouncementTickerProps {
  announcements: Announcement[];
  onNavigate: (route: string) => void;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({ announcements, onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  const activeList = announcements.filter((a) => a.isActive);

  if (dismissed || activeList.length === 0) return null;

  const current = activeList[0];

  return (
    <div className="bg-red-50 border-b border-red-200 text-[#171923] text-xs py-2 px-4 relative z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="flex-shrink-0 bg-[#E31837] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider flex items-center space-x-1">
            <Volume2 className="w-3 h-3" />
            <span>{current.badge || 'NOTICE'}</span>
          </span>
          <p className="truncate text-[#171923] font-medium">{current.message}</p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {current.linkText && current.linkUrl && (
            <button
              onClick={() => onNavigate(current.linkUrl!)}
              className="text-[#E31837] hover:text-[#b31028] font-bold flex items-center space-x-1 underline underline-offset-2 transition-colors"
            >
              <span>{current.linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-red-100"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
