import React, { useState } from 'react';
import { Conversation, User } from '../types/chat';
import { X, UserPlus, Users, MessageSquare } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewConversation: (newConv: Partial<Conversation>) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartNewConversation,
}) => {
  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    ];
    const pickedAvatar =
      avatarUrl.trim() ||
      defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    onStartNewConversation({
      id: `conv_${Date.now()}`,
      isGroup: activeTab === 'group',
      name: name.trim(),
      avatar: pickedAvatar,
      participants: ['user_me', `user_${Date.now()}`],
      unreadCount: 0,
      about: about.trim() || (activeTab === 'group' ? 'New group project' : 'Hey there! I am using PulseChat'),
    });

    setName('');
    setAbout('');
    setAvatarUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111b21] rounded-2xl border border-[#222e35] shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222e35]">
          <h3 className="font-bold text-base text-[#e9edef] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00a884]" /> New Chat
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 my-4 p-1 bg-[#202c33] rounded-xl">
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'dm'
                ? 'bg-[#00a884] text-[#111b21]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Direct Chat
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'group'
                ? 'bg-[#00a884] text-[#111b21]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Users className="w-4 h-4" /> New Group
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              {activeTab === 'group' ? 'Group Subject / Name' : 'Contact Name'}
            </label>
            <input
              type="text"
              required
              placeholder={activeTab === 'group' ? 'e.g. Frontend Architecture' : 'e.g. Jordan Smith'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              About / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lead Developer @ Pulse"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-[#111b21] text-xs font-bold rounded-lg transition-colors shadow-md"
            >
              Create {activeTab === 'group' ? 'Group' : 'Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
