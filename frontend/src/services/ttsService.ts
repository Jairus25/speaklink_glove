import { api } from './api';
import { TTSStatus } from '../types/smartGlove';

type StateListener = (status: TTSStatus) => void;

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private audioCache: Map<string, Blob> = new Map();
  private stateListeners: Set<StateListener> = new Set();
  private status: TTSStatus = 'idle';

  private setStatus(newStatus: TTSStatus) {
    this.status = newStatus;
    this.stateListeners.forEach((listener) => listener(newStatus));
  }

  public getStatus(): TTSStatus {
    return this.status;
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.status);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private getCacheKey(text: string, langCode: string): string {
    return `${text.trim()}:::${langCode.trim().toLowerCase()}`;
  }

  /**
   * Stop any current audio and release Blob URL
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.setStatus('idle');
  }

  /**
   * Pause playing audio
   */
  public pause(): void {
    if (this.currentAudio && this.status === 'playing') {
      this.currentAudio.pause();
      this.setStatus('paused');
    }
  }

  /**
   * Resume paused audio
   */
  public resume(): void {
    if (this.currentAudio && this.status === 'paused') {
      this.currentAudio.play().then(() => {
        this.setStatus('playing');
      }).catch((e) => {
        console.error('Audio resume failed:', e);
        this.setStatus('error');
      });
    }
  }

  /**
   * Fetch TTS audio (using cache if available) and play it
   */
  public async speak(text: string, languageCode: string): Promise<void> {
    if (!text || !text.trim()) return;

    this.stop();
    this.setStatus('loading');

    const key = this.getCacheKey(text, languageCode);
    let blob: Blob;

    try {
      if (this.audioCache.has(key)) {
        blob = this.audioCache.get(key)!;
      } else {
        blob = await api.getTTSAudioBlob(text, languageCode);
        this.audioCache.set(key, blob);
      }

      const blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;

      const audio = new Audio(blobUrl);
      this.currentAudio = audio;

      audio.onplay = () => {
        this.setStatus('playing');
      };

      audio.onended = () => {
        this.stop();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        this.stop();
        this.setStatus('error');
      };

      await audio.play();
    } catch (err) {
      console.error('TTS speech generation or playback failed:', err);
      this.stop();
      this.setStatus('error');
      throw err;
    }
  }

  /**
   * Synthesize a professional emergency alert siren sound using Web Audio API
   */
  public playEmergencySiren(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Modulate frequency for emergency warble
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.linearRampToValueAtTime(1200, now + 0.3);
      osc1.frequency.linearRampToValueAtTime(800, now + 0.6);
      osc1.frequency.linearRampToValueAtTime(1200, now + 0.9);
      osc1.frequency.linearRampToValueAtTime(800, now + 1.2);

      osc2.frequency.setValueAtTime(400, now);
      osc2.frequency.linearRampToValueAtTime(600, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(400, now + 0.6);
      osc2.frequency.linearRampToValueAtTime(600, now + 0.9);
      osc2.frequency.linearRampToValueAtTime(400, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    } catch (e) {
      console.warn('Emergency siren synthesis failed:', e);
    }
  }
}

export const ttsService = new TTSService();
