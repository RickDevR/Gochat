import React, { useState, useRef, useEffect } from 'react';
import {
  Conversation,
  Message,
  MessageType,
  User,
  MessageReply,
} from '../types/chat';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
  Reply,
  Star,
  Download,
  Info,
  X,
} from 'lucide-react';
import { soundManager } from '../services/mediaDevices';

interface ChatStageProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  onSendMessage: (
    text?: string,
    type?: MessageType,
    mediaUrl?: string,
    mediaCaption?: string,
    mediaDuration?: number,
    waveform?: number[],
    replyTo?: MessageReply
  ) => void;
  onStartCall: (isVideo: boolean) => void;
  onOpenLiveCamera: () => void;
  onOpenVideoNote: () => void;
  onOpenVoiceNote: () => void;
  onToggleMediaDrawer: () => void;
}

export const ChatStage: React.FC<ChatStageProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onStartCall,
  onOpenLiveCamera,
  onOpenVideoNote,
  onOpenVoiceNote,
  onToggleMediaDrawer,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageReply | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState<number>(1);
  const [searchInChat, setSearchInChat] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendText = () => {
    if (!inputText.trim()) return;
    soundManager.playMessageSent();
    onSendMessage(
      inputText.trim(),
      'text',
      undefined,
      undefined,
      undefined,
      undefined,
      replyingTo || undefined
    );
    setInputText('');
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleTogglePlayAudio = (msg: Message) => {
    if (!msg.mediaUrl) {
      // If synthetic mock audio note, play synthetic chime
      soundManager.playCallConnected();
      setPlayingAudioId(playingAudioId === msg.id ? null : msg.id);
      return;
    }

    let audio = audioElementsRef.current[msg.id];
    if (!audio) {
      audio = new Audio(msg.mediaUrl);
      audio.playbackRate = audioPlaybackSpeed;
      audio.onended = () => setPlayingAudioId(null);
      audioElementsRef.current[msg.id] = audio;
    }

    if (playingAudioId === msg.id) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Stop other playing audios
      Object.values(audioElementsRef.current).forEach((a) => a.pause());
      audio.play().catch(() => {});
      setPlayingAudioId(msg.id);
    }
  };

  const handleCycleSpeed = (msgId: string) => {
    const nextSpeed = audioPlaybackSpeed === 1 ? 1.5 : audioPlaybackSpeed === 1.5 ? 2 : 1;
    setAudioPlaybackSpeed(nextSpeed);
    const audio = audioElementsRef.current[msgId];
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const isImg = file.type.startsWith('image/');
      onSendMessage(
        undefined,
        isImg ? 'image' : 'file',
        result,
        file.name,
        undefined,
        undefined,
        replyingTo || undefined
      );
      setReplyingTo(null);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchInChat.trim()) return true;
    return m.text?.toLowerCase().includes(searchInChat.toLowerCase());
  });

  const EMOJI_LIST = ['👍', '❤️', '😂', '🔥', '🎉', '🙌', '🙏', '💯', '✨', '🚀', '😍', '👏'];

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] h-full overflow-hidden relative select-none">
      {/* Top Header Bar */}
      <div className="h-16 px-4 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between shrink-0 z-20">
        <div
          onClick={onToggleMediaDrawer}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <img
            src={conversation.avatar}
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover border border-[#2a3942]"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#e9edef] truncate group-hover:text-[#00a884] transition-colors">
              {conversation.name}
            </h3>
            <p className="text-xs text-[#8696a0] truncate">
              {conversation.isGroup
                ? `${conversation.participants.length} participants · PulseCore Guild`
                : 'online · click for contact info'}
            </p>
          </div>
        </div>

        {/* Right Action Icons: Calling, Search, Info */}
        <div className="flex items-center gap-1 sm:gap-2 text-[#8696a0]">
          <button
            onClick={() => onStartCall(true)}
            className="p-2 rounded-full hover:text-[#00a884] hover:bg-[#111b21] transition-colors"
            title="Start live video call"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => onStartCall(false)}
            className="p-2 rounded-full hover:text-[#00a884] hover:bg-[#111b21] transition-colors"
            title="Start live voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-5 bg-[#2a3942] mx-1" />

          <button
            onClick={() => setShowSearchBox(!showSearchBox)}
            className={`p-2 rounded-full transition-colors ${
              showSearchBox ? 'text-[#00a884] bg-[#111b21]' : 'hover:text-[#e9edef] hover:bg-[#111b21]'
            }`}
            title="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleMediaDrawer}
            className="p-2 rounded-full hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
            title="Contact & Media Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* In-chat Search Bar */}
      {showSearchBox && (
        <div className="px-4 py-2 bg-[#111b21] border-b border-[#222e35] flex items-center justify-between gap-3 animate-in slide-in-from-top duration-150 z-20">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchInChat}
              onChange={(e) => setSearchInChat(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#202c33] rounded-lg text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={() => {
              setShowSearchBox(false);
              setSearchInChat('');
            }}
            className="p-1 rounded text-[#8696a0] hover:text-[#e9edef]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Messages Thread Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0b141a]">
        {/* Encryption Assurance Notice */}
        <div className="flex justify-center my-3">
          <div className="bg-[#182229] border border-[#222e35] text-[#8696a0] text-[11px] px-3.5 py-1.5 rounded-lg text-center max-w-md shadow-sm">
            🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
          </div>
        </div>

        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === 'user_me';

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble Container */}
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md transition-all ${
                  isMe
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]/40'
                }`}
              >
                {/* Reply To Reference Quote */}
                {msg.replyTo && (
                  <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-[#00a884] text-xs">
                    <span className="font-semibold text-[#00a884] block">
                      {msg.replyTo.senderName}
                    </span>
                    <span className="text-white/80 line-clamp-1">{msg.replyTo.text}</span>
                  </div>
                )}

                {/* 1. Camera Snapshot / Image Message */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <img
                      src={msg.mediaUrl}
                      alt="Captured Snapshot"
                      className="w-full max-h-80 object-cover hover:scale-[1.01] transition-transform cursor-pointer"
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                    />
                    {msg.mediaCaption && (
                      <p className="p-2 text-xs text-[#e9edef]">{msg.mediaCaption}</p>
                    )}
                  </div>
                )}

                {/* 2. WhatsApp Circular Video Note */}
                {msg.type === 'video_note' && msg.mediaUrl && (
                  <div className="flex flex-col items-center py-1">
                    <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-[#00a884] bg-black shadow-xl group/vid">
                      <video
                        src={msg.mediaUrl}
                        playsInline
                        loop
                        autoPlay
                        muted
                        controls={false}
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] bg-black/60 px-2 py-1 rounded text-white font-mono">
                          Video Note
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#8696a0] font-mono mt-1">
                      📹 Circular Video Note ({msg.mediaDuration || 4}s)
                    </span>
                  </div>
                )}

                {/* 3. Voice Note with Waveform */}
                {msg.type === 'voice_note' && (
                  <div className="flex items-center gap-3 py-1 min-w-[240px]">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => handleTogglePlayAudio(msg)}
                      className="w-10 h-10 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-md"
                      title={playingAudioId === msg.id ? 'Pause' : 'Play voice note'}
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Waveform Bars */}
                    <div className="flex-1 flex items-center gap-0.5 h-7">
                      {(msg.mediaWaveform || [0.2, 0.5, 0.8, 0.4, 0.9, 0.7, 0.3, 0.6, 0.9, 0.5, 0.3, 0.7, 0.4]).map(
                        (amp, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              playingAudioId === msg.id ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                            }`}
                            style={{ height: `${Math.max(4, amp * 26)}px` }}
                          />
                        )
                      )}
                    </div>

                    {/* Speed button */}
                    <button
                      onClick={() => handleCycleSpeed(msg.id)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/20 text-[#e9edef] hover:bg-black/30 transition-colors shrink-0"
                      title="Playback speed"
                    >
                      {audioPlaybackSpeed}x
                    </button>
                  </div>
                )}

                {/* 4. Text Content */}
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Bubble Timestamp & Status Ticks */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] mt-1">
                  <span className="font-mono tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                      )}
                    </span>
                  )}
                </div>

                {/* Message Hover Quick Reaction & Reply Toolbar */}
                <div
                  className={`absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#111b21] border border-[#2a3942] px-2 py-1 rounded-full shadow-lg z-10 ${
                    isMe ? 'right-4' : 'left-4'
                  }`}
                >
                  <button
                    onClick={() =>
                      setReplyingTo({
                        id: msg.id,
                        text: msg.text || (msg.type === 'image' ? 'Photo' : 'Media note'),
                        senderName: isMe ? 'You' : conversation.name,
                        type: msg.type,
                      })
                    }
                    className="p-1 text-[#8696a0] hover:text-[#00a884] rounded-full hover:bg-[#202c33]"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between text-xs animate-in slide-in-from-bottom duration-150">
          <div className="border-l-2 border-[#00a884] pl-2.5">
            <span className="font-semibold text-[#00a884] block">
              Replying to {replyingTo.senderName}
            </span>
            <span className="text-[#8696a0] line-clamp-1">{replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-[#8696a0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Quick Picker Overlay */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-[#202c33] p-3 rounded-2xl border border-[#2a3942] shadow-2xl flex items-center gap-2 z-30 animate-in fade-in zoom-in-95 duration-150">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-xl p-1.5 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 bg-[#202c33] p-2 rounded-2xl border border-[#2a3942] shadow-2xl flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-150 min-w-[200px]">
          {/* Live Camera Snapshot */}
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onOpenLiveCamera();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] text-xs font-semibold text-[#e9edef] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span>Take Camera Snapshot</span>
          </button>

          {/* WhatsApp Circular Video Note */}
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onOpenVideoNote();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] text-xs font-semibold text-[#e9edef] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-[#00a884] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <span>Record Video Note</span>
          </button>

          {/* Upload Photo/Document */}
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] text-xs font-semibold text-[#e9edef] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <span>Upload Photo / Document</span>
          </button>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Bottom Message Input Bar */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#222e35] flex items-center gap-2 shrink-0 z-20">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-full transition-colors ${
            showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Attachment Toggle */}
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2 rounded-full transition-colors ${
            showAttachMenu ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
          title="Attach photo, video note, or file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Quick Camera Snapshot Button */}
        <button
          onClick={onOpenLiveCamera}
          className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] transition-colors"
          title="Take photo with webcam"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 bg-[#2a3942] rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none transition-colors"
          />
        </div>

        {/* Voice Note or Send Button */}
        {inputText.trim() ? (
          <button
            onClick={handleSendText}
            className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] transition-transform active:scale-95 shadow-md shadow-[#00a884]/20"
            title="Send message"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            {/* Quick Circular Video Note Button */}
            <button
              onClick={onOpenVideoNote}
              className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#111b21] transition-colors"
              title="Record circular video note"
            >
              <Video className="w-5 h-5" />
            </button>

            {/* Voice Note Button */}
            <button
              onClick={onOpenVoiceNote}
              className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] transition-transform active:scale-95 shadow-md shadow-[#00a884]/20"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
