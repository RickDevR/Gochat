import React, { useEffect, useRef, useState } from 'react';
import { Video, StopCircle, RefreshCw, Send, X, AlertCircle } from 'lucide-react';
import { getCameraStream, stopStream, getSupportedRecorderMimeType } from '../services/mediaDevices';

interface VideoNoteRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVideoNote: (videoBlobUrl: string, duration: number) => void;
}

export const VideoNoteRecorder: React.FC<VideoNoteRecorderProps> = ({
  isOpen,
  onClose,
  onSendVideoNote,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const MAX_DURATION = 60; // 60 seconds limit like WhatsApp

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    initCamera();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    stopStream(streamRef.current);
    streamRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setRecordedUrl(null);
    setElapsedSeconds(0);
    setErrorMsg(null);
  };

  const initCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await getCameraStream(
        {
          width: { ideal: 480 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        true // with mic audio
      );
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // prevent local feedback during recording
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Video note camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Cannot access camera or microphone.';
      setErrorMsg(
        `${msg} Please ensure microphone and camera permissions are allowed to record video notes.`
      );
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      const mimeType = getSupportedRecorderMimeType('video');
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordedDuration(elapsedSeconds);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error('Error starting MediaRecorder', err);
      setErrorMsg('Failed to start video note recording. Your browser may not support this video format.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRetake = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setElapsedSeconds(0);
    chunksRef.current = [];
    initCamera();
  };

  const handleSend = () => {
    if (!recordedUrl) return;
    onSendVideoNote(recordedUrl, recordedDuration || elapsedSeconds || 1);
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  // Compute SVG circular progress stroke
  const strokeRadius = 140;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference - (elapsedSeconds / MAX_DURATION) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111b21] rounded-2xl border border-[#222e35] shadow-2xl p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={() => {
            cleanup();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <h3 className="font-semibold text-base text-[#e9edef] flex items-center justify-center gap-2">
            <Video className="w-5 h-5 text-[#00a884]" /> Video Note
          </h3>
          <p className="text-xs text-[#8696a0] mt-0.5">
            {recordedUrl
              ? 'Preview your circular video message before sending'
              : isRecording
              ? `Recording... ${elapsedSeconds}s / ${MAX_DURATION}s`
              : 'Tap to record a WhatsApp-style circular video note'}
          </p>
        </div>

        {errorMsg ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-xs text-[#8696a0] leading-relaxed mb-4">{errorMsg}</p>
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-[#00a884] text-[#111b21] text-xs font-semibold rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Circular Viewfinder Container */
          <div className="relative w-72 h-72 my-2 flex items-center justify-center">
            {/* SVG Recording Perimeter Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
              <circle
                cx="144"
                cy="144"
                r={strokeRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="6"
              />
              {isRecording && (
                <circle
                  cx="144"
                  cy="144"
                  r={strokeRadius}
                  fill="none"
                  stroke="#00a884"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              )}
            </svg>

            {/* Circular Video Feed */}
            <div className="w-[270px] h-[270px] rounded-full overflow-hidden bg-black shadow-inner border-4 border-[#202c33] relative flex items-center justify-center">
              {recordedUrl ? (
                <video
                  src={recordedUrl}
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {/* Recording indicator dot */}
              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-full backdrop-blur-sm z-30">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono tabular-nums text-white font-medium">
                    {elapsedSeconds}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 flex items-center gap-4">
          {recordedUrl ? (
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#e9edef] rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={handleSend}
                className="px-6 py-2 bg-[#00a884] hover:bg-[#008f6f] text-xs font-bold text-[#111b21] rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#00a884]/20"
              >
                <Send className="w-4 h-4" /> Send Video Note
              </button>
            </>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2 shadow-lg animate-pulse"
            >
              <StopCircle className="w-5 h-5" /> Stop & Review
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!!errorMsg}
              className="px-6 py-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-[#111b21] text-xs font-bold rounded-full transition-all flex items-center gap-2 shadow-md shadow-[#00a884]/25 hover:scale-105 active:scale-95"
            >
              <Video className="w-4 h-4" /> Start Recording Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
