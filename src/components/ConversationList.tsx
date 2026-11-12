import React, { useState } from 'react';
import { Conversation, User } from '../types/chat';
import {
  Search,
  Pin,
  Check,
  CheckCheck,
  Camera,
  Video,
  Mic,
  Plus,
  Users,
  Filter,
} from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredConversations = conversations
    .filter((conv) => {
      if (filter === 'unread' && conv.unreadCount === 0) return false;
      if (filter === 'groups' && !conv.isGroup) return false;
      if (
        searchTerm.trim() &&
        !conv.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !conv.lastMessage?.text?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned chats on top, then newest timestamp
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

  const formatMessageTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessageSnippet = (conv: Conversation) => {
    const msg = conv.lastMessage;
    if (!msg) return <span className="text-[#8696a0]">No messages yet</span>;

    const isMe = msg.senderId === 'user_me';

    return (
      <div className="flex items-center gap-1.5 text-xs text-[#8696a0] truncate mt-0.5">
        {isMe && (
          <span className="shrink-0">
            {msg.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#8696a0]" />
            )}
          </span>
        )}

        {msg.type === 'image' && (
          <span className="flex items-center gap-1 text-[#e9edef]">
            <Camera className="w-3.5 h-3.5 text-[#00a884]" /> Photo
          </span>
        )}
        {msg.type === 'video_note' && (
          <span className="flex items-center gap-1 text-[#e9edef]">
            <Video className="w-3.5 h-3.5 text-[#00a884]" /> Video note ({msg.mediaDuration || 5}s)
          </span>
        )}
        {msg.type === 'voice_note' && (
          <span className="flex items-center gap-1 text-[#e9edef]">
            <Mic className="w-3.5 h-3.5 text-[#00a884]" /> Voice note ({msg.mediaDuration || 4}s)
          </span>
        )}
        {msg.type === 'video_call' && <span className="text-[#00a884]">📹 Video call</span>}
        {msg.type === 'voice_call' && <span className="text-[#00a884]">📞 Voice call</span>}
        {msg.type === 'text' && <span className="truncate">{msg.text}</span>}
      </div>
    );
  };

  return (
    <div className="w-[360px] shrink-0 flex flex-col bg-[#111b21] border-r border-[#222e35] select-none h-full">
      {/* Search & New Chat Bar */}
      <div className="p-3 bg-[#111b21] border-b border-[#222e35] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#e9edef] tracking-tight">Chats</h2>
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
            title="New direct or group chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#202c33] rounded-lg text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#00a884] text-[#111b21]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-[#00a884] text-[#111b21]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === 'groups'
                ? 'bg-[#00a884] text-[#111b21]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/30">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8696a0]">
            No conversations match your filter.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#2a3942]'
                    : 'hover:bg-[#202c33]/60 bg-transparent'
                }`}
              >
                {/* Avatar with optional group icon */}
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#2a3942]"
                  />
                  {conv.isGroup && (
                    <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-[#202c33] rounded-full border border-[#111b21] text-[#00a884]">
                      <Users className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#e9edef] truncate">{conv.name}</h3>
                    <span className="text-[11px] font-mono tabular-nums text-[#8696a0] shrink-0 ml-2">
                      {formatMessageTime(conv.lastMessage?.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex-1 min-w-0 pr-2">{renderLastMessageSnippet(conv)}</div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0]" />}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#00a884] text-[#111b21] text-[10px] font-extrabold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
