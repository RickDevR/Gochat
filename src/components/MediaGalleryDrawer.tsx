import React, { useState } from 'react';
import { Conversation, Message } from '../types/chat';
import { X, Image, Video, Mic, FileText, Phone, Shield, Bell, Lock } from 'lucide-react';

interface MediaGalleryDrawerProps {
  conversation: Conversation;
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (isVideo: boolean) => void;
}

export const MediaGalleryDrawer: React.FC<MediaGalleryDrawerProps> = ({
  conversation,
  messages,
  isOpen,
  onClose,
  onStartCall,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'voice' | 'docs'>('media');

  if (!isOpen) return null;

  const mediaMessages = messages.filter(
    (m) => (m.type === 'image' || m.type === 'video_note') && m.mediaUrl
  );
  const voiceMessages = messages.filter((m) => m.type === 'voice_note');
  const docMessages = messages.filter((m) => m.type === 'file');

  return (
    <div className="w-80 shrink-0 bg-[#111b21] border-l border-[#222e35] flex flex-col h-full overflow-hidden select-none animate-in slide-in-from-right duration-200 z-30">
      {/* Top Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e9edef]">Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contact Overview Card */}
        <div className="p-6 flex flex-col items-center text-center bg-[#111b21] border-b border-[#222e35]">
          <img
            src={conversation.avatar}
            alt={conversation.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#2a3942] mb-3"
          />
          <h2 className="text-base font-bold text-[#e9edef] leading-tight">
            {conversation.name}
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            {conversation.about || 'Available on PulseChat Desktop'}
          </p>

          {/* Quick Call Actions */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => onStartCall(false)}
              className="p-3 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] rounded-full transition-colors"
              title="Voice call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartCall(true)}
              className="p-3 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] rounded-full transition-colors"
              title="Video call"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Encryption Details */}
        <div className="p-4 border-b border-[#222e35] flex items-center gap-3 text-xs text-[#8696a0]">
          <Lock className="w-4 h-4 text-[#00a884] shrink-0" />
          <span>Messages and calls are end-to-end encrypted. Tap to verify.</span>
        </div>

        {/* Media Tabs */}
        <div className="p-3 border-b border-[#222e35] flex items-center gap-1">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'media'
                ? 'bg-[#202c33] text-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Media ({mediaMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-[#202c33] text-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice ({voiceMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-[#202c33] text-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Docs ({docMessages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3">
          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-xs text-[#8696a0]">
                  No photos or video notes yet.
                </div>
              ) : (
                mediaMessages.map((m) => (
                  <div
                    key={m.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-black/40 border border-[#222e35] group cursor-pointer"
                    onClick={() => m.mediaUrl && window.open(m.mediaUrl, '_blank')}
                  >
                    {m.type === 'video_note' ? (
                      <video
                        src={m.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={m.mediaUrl}
                        alt="Media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    {m.type === 'video_note' && (
                      <div className="absolute bottom-1 right-1 bg-black/70 p-0.5 rounded text-[10px] text-white">
                        <Video className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-2">
              {voiceMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8696a0]">
                  No recorded voice notes in this conversation.
                </div>
              ) : (
                voiceMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-[#00a884]" />
                      <span className="text-[#e9edef] font-medium">Voice note</span>
                      <span className="text-[#8696a0] font-mono">
                        ({m.mediaDuration || 4}s)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8696a0] font-mono">
                      {new Date(m.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-2">
              {docMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8696a0]">
                  No documents shared in this conversation.
                </div>
              ) : (
                docMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-[#e9edef] font-medium truncate">
                        {m.mediaCaption || 'Document'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
