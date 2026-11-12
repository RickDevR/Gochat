/**
 * Media device services for PulseChat Desktop
 * Provides real hardware webcam, microphone, MediaRecorder, AudioContext visualizer,
 * screen-sharing, and synthesized acoustic telephone tones.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play authentic telephone ringing tone (440Hz + 480Hz US standard tone)
   */
  startOutgoingRingtone() {
    this.stopOutgoingRingtone();
    const ctx = this.getAudioContext();

    const playBurst = () => {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 1.95);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      } catch (err) {
        console.warn('Audio ringtone burst error', err);
      }
    };

    playBurst();
    this.ringInterval = window.setInterval(playBurst, 4000);
  }

  stopOutgoingRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Sound effect when a call is connected
   */
  playCallConnected() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio autoplay policy
    }
  }

  /**
   * Sound effect when a call terminates
   */
  playCallEnded() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore audio error
    }
  }

  /**
   * Camera shutter click sound
   */
  playShutterSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Quick white noise burst + resonant click
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // Ignore
    }
  }

  /**
   * Message sent pop
   */
  playMessageSent() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundSynthesizer();

/**
 * Check browser media capabilities
 */
export async function checkMediaPermissions(): Promise<{
  hasCamera: boolean;
  hasMic: boolean;
}> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { hasCamera: false, hasMic: false };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((d) => d.kind === 'videoinput');
    const hasMic = devices.some((d) => d.kind === 'audioinput');
    return { hasCamera, hasMic };
  } catch (err) {
    console.warn('Could not enumerate media devices', err);
    return { hasCamera: false, hasMic: false };
  }
}

/**
 * Request real user webcam stream
 */
export async function getCameraStream(
  videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  withAudio: boolean = false
): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: withAudio,
  });
}

/**
 * Request real user microphone stream
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
}

/**
 * Request screen sharing stream
 */
export async function getScreenShareStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen sharing is not supported in this browser.');
  }
  return await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
}

/**
 * Stop all tracks on a MediaStream safely
 */
export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // Ignore
    }
  });
}

/**
 * Supported MediaRecorder mimeTypes
 */
export function getSupportedRecorderMimeType(kind: 'video' | 'audio'): string {
  if (kind === 'video') {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  } else {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }
}
