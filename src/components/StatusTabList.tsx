import React from 'react';
import { StatusStory, User } from '../types/chat';
import { Plus, Camera, Edit3, Sparkles } from 'lucide-react';

interface StatusTabListProps {
  stories: StatusStory[];
  currentUser: User;
  onOpenStory: (index: number) => void;
  onOpenSnapStatus: () => void;
  onOpenTextStatus: () => void;
}

export const StatusTabList: React.FC<StatusTabListProps> = ({
  stories,
  currentUser,
  onOpenStory,
  onOpenSnapStatus,
  onOpenTextStatus,
}) => {
  const myStories = stories.filter((s) => s.userId === currentUser.id);
  const otherStories = stories.filter((s) => s.userId !== currentUser.id);

  return (
    <div className="flex-1 flex flex-col bg-[#111b21] border-r border-[#222e35] overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between">
        <h2 className="text-base font-bold text-[#e9edef]">Status Updates</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSnapStatus}
            className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
            title="Take status photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenTextStatus}
            className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
            title="Create text status"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* My Status Section */}
      <div className="p-4 border-b border-[#222e35]/60 hover:bg-[#202c33]/40 transition-colors">
        <div className="flex items-center justify-between">
          <div
            onClick={() => {
              if (myStories.length > 0) {
                const idx = stories.findIndex((s) => s.userId === currentUser.id);
                onOpenStory(idx >= 0 ? idx : 0);
              } else {
                onOpenSnapStatus();
              }
            }}
            className="flex items-center gap-3.5 cursor-pointer flex-1"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-[#2a3942]"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold text-xs shadow">
                <Plus className="w-3 h-3" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#e9edef]">My Status</h3>
              <p className="text-xs text-[#8696a0] mt-0.5">
                {myStories.length > 0
                  ? `${myStories.length} update posted · Tap to view`
                  : 'Tap to add status update'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates Header */}
      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#8696a0]">
        Recent Updates
      </div>

      {/* Stories list */}
      <div className="divide-y divide-[#222e35]/40">
        {otherStories.map((story) => {
          const originalIndex = stories.findIndex((s) => s.id === story.id);

          return (
            <div
              key={story.id}
              onClick={() => onOpenStory(originalIndex)}
              className="p-3.5 hover:bg-[#202c33]/50 transition-colors flex items-center gap-3.5 cursor-pointer"
            >
              {/* Emerald circular status story ring */}
              <div className="relative p-0.5 rounded-full border-2 border-[#00a884]">
                <img
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#e9edef] truncate">{story.userName}</h4>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {new Date(story.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {story.caption ? ` · ${story.caption}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
