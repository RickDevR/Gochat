import React from 'react';
import {
  MessageSquare,
  Radio,
  CircleDot,
  Phone,
  Star,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { User } from '../types/chat';

export type ActiveTab = 'chats' | 'voice' | 'status' | 'calls' | 'settings';

interface NavigationRailProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unreadCount: number;
  hasUnreadStories: boolean;
  currentUser: User;
  onOpenProfile: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  unreadCount,
  hasUnreadStories,
  currentUser,
  onOpenProfile,
}) => {
  return (
    <aside className="w-16 shrink-0 bg-[#202c33] border-r border-[#222e35] flex flex-col items-center justify-between py-4 select-none z-20">
      {/* Top Section: App Mark + Main Tabs */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* App Logo */}
        <div
          onClick={() => onSelectTab('chats')}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-[#111b21] shadow-lg shadow-[#00a884]/20 cursor-pointer hover:scale-105 transition-transform"
          title="PulseChat Desktop"
        >
          <MessageSquare className="w-5 h-5 fill-current text-[#111b21]" />
        </div>

        {/* Primary Tabs */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Chats */}
          <button
            onClick={() => onSelectTab('chats')}
            className={`relative p-3 rounded-xl transition-all ${
              activeTab === 'chats'
                ? 'bg-[#111b21] text-[#00a884] shadow-inner'
                : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/50'
            }`}
            title="Chats"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00a884] text-[#111b21] text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Voice Lounges (Discord-inspired) */}
          <button
            onClick={() => onSelectTab('voice')}
            className={`relative p-3 rounded-xl transition-all ${
              activeTab === 'voice'
                ? 'bg-[#111b21] text-[#00a884] shadow-inner'
                : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/50'
            }`}
            title="Voice Lounges (Discord channels)"
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* Status Stories */}
          <button
            onClick={() => onSelectTab('status')}
            className={`relative p-3 rounded-xl transition-all ${
              activeTab === 'status'
                ? 'bg-[#111b21] text-[#00a884] shadow-inner'
                : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/50'
            }`}
            title="Status Stories"
          >
            <CircleDot className="w-5 h-5" />
            {hasUnreadStories && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00a884]" />
            )}
          </button>

          {/* Calls */}
          <button
            onClick={() => onSelectTab('calls')}
            className={`relative p-3 rounded-xl transition-all ${
              activeTab === 'calls'
                ? 'bg-[#111b21] text-[#00a884] shadow-inner'
                : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/50'
            }`}
            title="Calls & Recents"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Section: Settings & User Profile Avatar */}
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => onSelectTab('settings')}
          className={`p-3 rounded-xl transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#111b21] text-[#00a884]'
              : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21]/50'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Current User Avatar */}
        <div
          onClick={onOpenProfile}
          className="relative group cursor-pointer"
          title={`${currentUser.name} (Click to edit profile)`}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-[#00a884] transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
        </div>
      </div>
    </aside>
  );
};
