import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Send, AlertCircle, Play, Pause } from 'lucide-react';
import { getMicrophoneStream, stopStream, getSupportedRecorderMimeType } from '../services/mediaDevices';

interface VoiceNoteRecorderProps {
  isOpen: boolean;
  onCancel: () => void;
  onSendVoiceNote: (audioUrl: string, durationSeconds: number, waveform: number[]) => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  isOpen,
  onCancel,
  onSendVoiceNote,
}) => {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformSamplesRef = useRef<number[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startRecording();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    stopStream(streamRef.current);
    streamRef.current = null;
    chunksRef.current = [];
    waveformSamplesRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setRecordedAudioUrl(null);
    setIsPlayingPreview(false);
    setErrorMsg(null);
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      waveformSamplesRef.current = [];
      chunksRef.current = [];

      const stream = await getMicrophoneStream();
      streamRef.current = stream;

      // Audio analysis for real-time waveform
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start MediaRecorder
      const mimeType = getSupportedRecorderMimeType('audio');
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      // Start seconds timer
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Start waveform rendering loop
      renderWaveform();
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      const msg = err instanceof Error ? err.message : 'Cannot access microphone.';
      setErrorMsg(`${msg} Please ensure microphone access is granted.`);
    }
  };

  const renderWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Compute average volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normalized = Math.min(1, Math.max(0.08, avg / 128));

      // Collect sample for final message
      if (Math.random() < 0.25 && waveformSamplesRef.current.length < 32) {
        waveformSamplesRef.current.push(Number(normalized.toFixed(2)));
      }

      // Draw bars on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = 3;
      const gap = 3;
      const barCount = Math.floor(canvas.width / (barWidth + gap));
      const step = Math.floor(bufferLength / barCount) || 1;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.min(bufferLength - 1, i * step);
        const val = dataArray[dataIndex] / 255;
        const barHeight = Math.max(4, val * (canvas.height - 4));
        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = '#00a884';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();
  };

  const handleStopAndReview = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTogglePreview = () => {
    if (!recordedAudioUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudioUrl);
      audio.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current = audio;
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    if (!recordedAudioUrl) {
      // If user clicks send directly while recording
      handleStopAndReview();
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const wf = waveformSamplesRef.current.length > 0 ? waveformSamplesRef.current : [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3];
          onSendVoiceNote(url, Math.max(1, elapsedSeconds), wf);
          cleanup();
          onCancel();
        }
      }, 200);
      return;
    }

    const wf = waveformSamplesRef.current.length > 0 ? waveformSamplesRef.current : [0.2, 0.6, 0.8, 0.5, 0.9, 0.7, 0.4];
    onSendVoiceNote(recordedAudioUrl, Math.max(1, elapsedSeconds), wf);
    cleanup();
    onCancel();
  };

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 bg-[#202c33] border-t border-[#2a3942] p-3 flex items-center justify-between gap-4 shadow-xl animate-in slide-in-from-bottom duration-200">
      {errorMsg ? (
        <div className="flex items-center gap-3 text-xs text-rose-400 w-full px-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => {
              cleanup();
              onCancel();
            }}
            className="px-3 py-1 bg-[#111b21] rounded text-[#e9edef] hover:bg-[#2a3942]"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <>
          {/* Delete Button */}
          <button
            onClick={() => {
              cleanup();
              onCancel();
            }}
            className="p-2 rounded-full text-[#8696a0] hover:text-rose-400 hover:bg-[#111b21] transition-colors"
            title="Discard voice note"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Center Stage: Timer & Waveform */}
          <div className="flex-1 flex items-center gap-3 bg-[#111b21] px-4 py-2 rounded-full border border-[#2a3942]">
            {/* Blinking red mic or preview play button */}
            {recordedAudioUrl ? (
              <button
                onClick={handleTogglePreview}
                className="w-7 h-7 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center hover:scale-105 transition-transform"
                title={isPlayingPreview ? 'Pause preview' : 'Play preview'}
              >
                {isPlayingPreview ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <Mic className="w-4 h-4 text-rose-400" />
              </div>
            )}

            <span className="text-xs font-mono tabular-nums text-[#e9edef] font-semibold min-w-[36px]">
              {formatTime(elapsedSeconds)}
            </span>

            {/* Dynamic Canvas Waveform */}
            <div className="flex-1 h-7 flex items-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={360}
                height={28}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Action Buttons: Stop / Send */}
          <div className="flex items-center gap-2">
            {isRecording && (
              <button
                onClick={handleStopAndReview}
                className="p-2.5 rounded-full bg-[#111b21] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                title="Stop and review"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={handleSend}
              className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] transition-transform active:scale-95 shadow-md shadow-[#00a884]/20"
              title="Send voice note"
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
