import React, { useEffect, useState, useRef } from 'react';
import { StatusStory, User } from '../types/chat';
import { X, ChevronLeft, ChevronRight, Send, Camera, Eye, Plus, Sparkles } from 'lucide-react';

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StatusStory[];
  initialIndex?: number;
  onReplyToStory?: (story: StatusStory, text: string) => void;
  onAddStory?: (newStory: Omit<StatusStory, 'id' | 'timestamp' | 'viewsCount'>) => void;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onReplyToStory,
  onAddStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusBg, setNewStatusBg] = useState('#005c4b');

  const timerRef = useRef<number | null>(null);
  const STORY_DURATION_MS = 5000;
  const TICK_INTERVAL_MS = 50;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen || isCreatingStory || stories.length === 0) return;

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + (TICK_INTERVAL_MS / STORY_DURATION_MS) * 100;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isPaused, isCreatingStory, stories.length]);

  const handleNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !stories[currentIndex]) return;
    if (onReplyToStory) {
      onReplyToStory(stories[currentIndex], replyText.trim());
    }
    setReplyText('');
    onClose();
  };

  const handleCreateTextStory = () => {
    if (!newStatusText.trim() || !onAddStory) return;
    onAddStory({
      userId: 'user_me',
      userName: 'Alex Mercer',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      mediaType: 'text',
      textContent: newStatusText.trim(),
      backgroundColor: newStatusBg,
    });
    setNewStatusText('');
    setIsCreatingStory(false);
  };

  if (!isOpen) return null;

  const currentStory = stories[currentIndex];

  const BG_COLORS = ['#005c4b', '#1f2c34', '#7c3aed', '#b91c1c', '#0284c7', '#d97706'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 z-50 transition-colors"
        title="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Status Container */}
      <div className="relative w-full max-w-md h-[86vh] max-h-[750px] bg-[#111b21] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-[#222e35]">
        {isCreatingStory ? (
          /* Story Creation View */
          <div
            className="flex-1 flex flex-col justify-between p-6 transition-colors duration-300"
            style={{ backgroundColor: newStatusBg }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-white/80">
                New Status Update
              </span>
              <button
                onClick={() => setIsCreatingStory(false)}
                className="text-xs text-white/80 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <textarea
              value={newStatusText}
              onChange={(e) => setNewStatusText(e.target.value)}
              placeholder="Type a status update..."
              maxLength={200}
              className="w-full bg-transparent text-2xl font-bold text-center text-white placeholder-white/50 focus:outline-none resize-none"
              rows={4}
              autoFocus
            />

            <div className="flex flex-col gap-4">
              {/* Color swatches */}
              <div className="flex items-center justify-center gap-2">
                {BG_COLORS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setNewStatusBg(bg)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      newStatusBg === bg ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: bg }}
                  />
                ))}
              </div>

              <button
                onClick={handleCreateTextStory}
                disabled={!newStatusText.trim()}
                className="w-full py-3 bg-white text-[#111b21] font-bold text-sm rounded-xl hover:bg-white/90 disabled:opacity-50 transition-colors shadow-lg"
              >
                Post Status
              </button>
            </div>
          </div>
        ) : currentStory ? (
          /* Active Story View */
          <>
            {/* Top Segmented Progress Bar */}
            <div className="absolute top-0 inset-x-0 z-30 p-3 pt-3 flex items-center gap-1.5 bg-gradient-to-b from-black/70 to-transparent">
              {stories.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{
                      width:
                        idx < currentIndex
                          ? '100%'
                          : idx === currentIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story User Info Header */}
            <div className="absolute top-6 inset-x-0 z-30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentStory.userAvatar}
                  alt={currentStory.userName}
                  className="w-9 h-9 rounded-full object-cover border border-white/20"
                />
                <div>
                  <h4 className="text-sm font-semibold text-white leading-tight">
                    {currentStory.userName}
                  </h4>
                  <span className="text-[11px] text-white/70">
                    {new Date(currentStory.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{currentStory.viewsCount}</span>
              </div>
            </div>

            {/* Tap areas: Left & Right navigation */}
            <button
              onClick={handlePrevStory}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
              title="Previous"
            />
            <button
              onClick={handleNextStory}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
              title="Next"
            />

            {/* Main Content Area */}
            <div
              className="flex-1 relative flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: currentStory.backgroundColor || '#111b21',
              }}
            >
              {currentStory.mediaType === 'image' && currentStory.mediaUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentStory.mediaUrl}
                    alt="Status story"
                    className="w-full h-full object-cover"
                  />
                  {currentStory.caption && (
                    <div className="absolute bottom-4 inset-x-4 bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-center text-sm font-medium text-white">
                      {currentStory.caption}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center max-w-xs">
                  <p className="text-2xl font-bold text-white leading-relaxed">
                    {currentStory.textContent}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Reply Bar */}
            <div className="p-3 bg-[#111b21] border-t border-[#222e35] flex items-center gap-2 z-30">
              <input
                type="text"
                placeholder={`Reply to ${currentStory.userName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 px-4 py-2 bg-[#202c33] rounded-full text-xs text-white placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="p-2 rounded-full bg-[#00a884] text-[#111b21] disabled:opacity-50 hover:bg-[#008f6f] transition-colors"
                title="Send reply"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8696a0]">
            <p className="text-sm font-medium mb-3">No active status updates</p>
            <button
              onClick={() => setIsCreatingStory(true)}
              className="px-4 py-2 bg-[#00a884] text-[#111b21] text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Post First Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
