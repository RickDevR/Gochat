import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
  Volume2,
  VolumeX,
  Users,
} from 'lucide-react';
import { Conversation, User } from '../types/chat';
import {
  getCameraStream,
  getMicrophoneStream,
  getScreenShareStream,
  stopStream,
  soundManager,
} from '../services/mediaDevices';

interface CallTheaterProps {
  isOpen: boolean;
  isVideo: boolean;
  contact: Conversation;
  currentUser: User;
  onEndCall: (durationSeconds: number) => void;
}

export const CallTheater: React.FC<CallTheaterProps> = ({
  isOpen,
  isVideo,
  contact,
  currentUser,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'remote' | 'local'>('remote');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startCallFlow();

    return () => {
      cleanup();
    };
  }, [isOpen, isVideo]);

  const cleanup = () => {
    soundManager.stopOutgoingRingtone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopStream(localStreamRef.current);
    stopStream(screenStreamRef.current);
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setDuration(0);
    setCallState('ringing');
    setIsScreenSharing(false);
  };

  const startCallFlow = async () => {
    // 1. Play ringing tone
    soundManager.startOutgoingRingtone();

    // 2. Obtain local media stream (camera if video call, mic always)
    try {
      if (isVideo) {
        const stream = await getCameraStream({ facingMode: 'user' }, true);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => {});
        }
      } else {
        const stream = await getMicrophoneStream();
        localStreamRef.current = stream;
      }
    } catch (err) {
      console.warn('Could not acquire local devices for call:', err);
    }

    // 3. Connect call after realistic 3.5 seconds
    const connectTimer = window.setTimeout(() => {
      soundManager.stopOutgoingRingtone();
      soundManager.playCallConnected();
      setCallState('connected');

      // Start duration counter
      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }, 3500);

    return () => clearTimeout(connectTimer);
  };

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted; // toggle
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = isVideoDisabled; // toggle
      });
    }
    setIsVideoDisabled(!isVideoDisabled);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await getScreenShareStream();
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play().catch(() => {});
      }

      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
      };
    } catch (err) {
      console.warn('Screen share canceled or denied', err);
      setIsScreenSharing(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleHangup = () => {
    soundManager.stopOutgoingRingtone();
    soundManager.playCallEnded();
    onEndCall(duration);
    cleanup();
  };

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-[#e9edef] animate-in fade-in duration-300 select-none"
    >
      {/* Top Bar Overlay */}
      <div className="absolute top-0 inset-x-0 z-30 p-5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover border border-[#2a3942]"
          />
          <div>
            <h2 className="text-base font-semibold leading-tight text-white">{contact.name}</h2>
            <div className="flex items-center gap-2 text-xs text-[#8696a0]">
              <span className="capitalize">
                {callState === 'ringing' ? 'Ringing...' : isVideo ? 'Live Video Call' : 'Voice Call'}
              </span>
              {callState === 'connected' && (
                <>
                  <span>·</span>
                  <span className="font-mono tabular-nums text-[#00a884] font-medium">
                    {formatDuration(duration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-sm transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Call Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#111b21]">
        {/* If Screen Sharing is active */}
        {isScreenSharing ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded-xl object-contain shadow-2xl border border-[#202c33]"
            />
            <div className="absolute top-20 left-6 bg-[#111b21]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#202c33] text-xs text-[#00a884] font-semibold flex items-center gap-2">
              <Monitor className="w-4 h-4" /> You are presenting your screen
            </div>
          </div>
        ) : isVideo ? (
          /* Video Call Viewport */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Remote Feed (High visual fidelity representation) */}
            <div className="relative w-full h-full flex items-center justify-center bg-[#111b21]">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-full h-full object-cover opacity-85 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

              {/* Active remote speaker indicator */}
              <div className="absolute bottom-28 left-8 flex items-center gap-3 bg-[#111b21]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222e35]">
                <div className="w-3 h-3 rounded-full bg-[#00a884] animate-pulse" />
                <span className="text-xs font-medium text-white">{contact.name}</span>
              </div>
            </div>

            {/* Local Webcam Picture-in-Picture */}
            <div className="absolute bottom-28 right-8 w-48 sm:w-64 aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border-2 border-[#202c33] z-20 group">
              {isVideoDisabled ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#182229]">
                  <VideoOff className="w-6 h-6 text-[#8696a0] mb-1" />
                  <span className="text-[11px] text-[#8696a0]">Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
              <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                You {isMuted ? '(Muted)' : ''}
              </div>
            </div>
          </div>
        ) : (
          /* Voice Call Stage */
          <div className="flex flex-col items-center justify-center p-8 max-w-sm text-center">
            <div className="relative mb-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#202c33] shadow-2xl">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Acoustic Voice Wave Rings */}
              {callState === 'connected' && (
                <div className="absolute -inset-3 rounded-full border border-[#00a884]/40 animate-ping pointer-events-none" />
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">{contact.name}</h3>
            <p className="text-sm text-[#8696a0]">
              {callState === 'ringing'
                ? 'Ringing mobile & desktop client...'
                : `Connected · ${formatDuration(duration)}`}
            </p>

            {/* Live Audio Amplitude Waves Visualizer */}
            {callState === 'connected' && (
              <div className="flex items-center gap-1.5 h-10 mt-6">
                {[4, 12, 24, 18, 30, 22, 14, 28, 20, 8].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#00a884] rounded-full animate-audio-wave"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-6 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="flex items-center gap-3 sm:gap-5 bg-[#182229]/90 backdrop-blur-md px-6 py-3 rounded-full border border-[#2a3942] shadow-2xl">
          {/* Mute Mic */}
          <button
            onClick={handleToggleMute}
            className={`p-3.5 rounded-full transition-all active:scale-95 ${
              isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-[#222e35] text-[#e9edef] hover:bg-[#2a3942]'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          {isVideo && (
            <button
              onClick={handleToggleVideo}
              className={`p-3.5 rounded-full transition-all active:scale-95 ${
                isVideoDisabled
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#222e35] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
              title={isVideoDisabled ? 'Turn camera on' : 'Turn camera off'}
            >
              {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 rounded-full transition-all active:scale-95 ${
              isScreenSharing
                ? 'bg-[#00a884] text-[#111b21]'
                : 'bg-[#222e35] text-[#e9edef] hover:bg-[#2a3942]'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Hang Up Button */}
          <button
            onClick={handleHangup}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all transform active:scale-95 shadow-lg shadow-rose-600/30"
            title="End call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
