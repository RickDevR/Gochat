import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check, Sparkles, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { getCameraStream, stopStream, soundManager } from '../services/mediaDevices';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, caption?: string) => void;
  title?: string;
}

type FilterMode = 'normal' | 'vivid' | 'warm' | 'mono' | 'emerald';

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Photo',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState<FilterMode>('normal');
  const [timer, setTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startCamera();

    return () => {
      cleanup();
    };
  }, [isOpen, isFrontCamera]);

  const cleanup = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCapturedImage(null);
    setCaption('');
    setCountdown(null);
    setErrorMsg(null);
  };

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      stopStream(streamRef.current);

      const constraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: isFrontCamera ? 'user' : 'environment',
      };

      const stream = await getCameraStream(constraints, false);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const message = err instanceof Error ? err.message : 'Unable to access your camera.';
      setErrorMsg(
        `${message} Please allow camera permissions in your browser or ensure no other app is using your webcam.`
      );
    }
  };

  const triggerSnap = () => {
    if (!videoRef.current || !streamRef.current) return;

    if (timer > 0 && countdown === null) {
      setCountdown(timer);
      const interval = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            executeCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    executeCapture();
  };

  const executeCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger visual flash & audio click
    setIsFlashActive(true);
    soundManager.playShutterSound();
    setTimeout(() => setIsFlashActive(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Apply front camera mirroring if applicable
    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply color filters onto canvas
    if (filter === 'vivid') {
      ctx.filter = 'saturate(1.4) contrast(1.1)';
    } else if (filter === 'warm') {
      ctx.filter = 'sepia(0.25) saturate(1.2) contrast(1.05)';
    } else if (filter === 'mono') {
      ctx.filter = 'grayscale(1) contrast(1.3)';
    } else if (filter === 'emerald') {
      ctx.filter = 'hue-rotate(60deg) saturate(1.3)';
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    onCapture(capturedImage, caption.trim() || undefined);
    cleanup();
    onClose();
  };

  const getFilterStyle = (): React.CSSProperties => {
    switch (filter) {
      case 'vivid':
        return { filter: 'saturate(1.4) contrast(1.1)' };
      case 'warm':
        return { filter: 'sepia(0.25) saturate(1.2) contrast(1.05)' };
      case 'mono':
        return { filter: 'grayscale(1) contrast(1.3)' };
      case 'emerald':
        return { filter: 'hue-rotate(60deg) saturate(1.3)' };
      default:
        return {};
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#111b21] rounded-2xl border border-[#222e35] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222e35] bg-[#202c33]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#00a884]" />
            <span className="font-semibold text-sm text-[#e9edef]">{title}</span>
          </div>
          <button
            onClick={() => {
              cleanup();
              onClose();
            }}
            className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Stage */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-sm text-[#e9edef] font-medium mb-2">Camera Unavailable</p>
              <p className="text-xs text-[#8696a0] leading-relaxed mb-4">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Reconnecting
              </button>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#111b21]/80 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-[#00a884] font-medium border border-[#222e35]">
                Ready to Send
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={getFilterStyle()}
                className={`w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
              />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <span className="text-7xl font-extrabold text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Flash animation */}
          {isFlashActive && (
            <div className="absolute inset-0 bg-white pointer-events-none animate-out fade-out duration-150" />
          )}
        </div>

        {/* Control Bar / Capture / Send */}
        <div className="p-4 bg-[#111b21] flex flex-col gap-3">
          {capturedImage ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none transition-colors"
                autoFocus
              />
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#e9edef] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Retake
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      cleanup();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-transparent hover:bg-[#202c33] text-xs font-medium text-[#8696a0] hover:text-[#e9edef] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-5 py-2 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-xs font-bold text-[#111b21] transition-all flex items-center gap-1.5 shadow-md shadow-[#00a884]/20"
                  >
                    <Check className="w-4 h-4" /> Send Photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Filter & Timer Bar */}
              <div className="flex items-center justify-between text-xs text-[#8696a0] border-b border-[#222e35] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-[#8696a0] font-medium mr-1">
                    Filter:
                  </span>
                  {(['normal', 'vivid', 'warm', 'mono', 'emerald'] as FilterMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilter(mode)}
                      className={`px-2.5 py-1 rounded capitalize transition-colors ${
                        filter === mode
                          ? 'bg-[#00a884] text-[#111b21] font-bold'
                          : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 5 : 0))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      timer > 0
                        ? 'bg-[#00a884]/20 text-[#00a884] font-medium border border-[#00a884]/40'
                        : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    {timer === 0 ? 'Timer: Off' : `Timer: ${timer}s`}
                  </button>

                  <button
                    onClick={() => setIsFrontCamera(!isFrontCamera)}
                    className="p-1.5 bg-[#202c33] hover:bg-[#2a3942] rounded text-[#8696a0] hover:text-[#e9edef] transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Shutter Button Zone */}
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={triggerSnap}
                  disabled={!!errorMsg}
                  className="relative group p-1 rounded-full border-2 border-white/60 hover:border-white transition-all transform active:scale-95 disabled:opacity-50"
                  title="Take photo"
                >
                  <div className="w-14 h-14 rounded-full bg-white group-hover:bg-[#00a884] transition-colors shadow-lg flex items-center justify-center" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
