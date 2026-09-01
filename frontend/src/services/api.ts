import { SmartGloveData } from '../types/smartGlove';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LatestApiResponse {
  status?: string;
  data: SmartGloveData | null;
}

export interface TranslationApiResponse {
  translated_text: string;
  language: string;
}

export const api = {
  /**
   * Health check to test connectivity to FastAPI backend
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Fetch the latest Smart Glove reading from FastAPI backend
   */
  async fetchLatest(): Promise<SmartGloveData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${API_BASE_URL}/latest`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Failed to fetch latest data: HTTP ${res.status}`);
      }
      const json: LatestApiResponse = await res.json();
      return json.data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  /**
   * Translate text using FastAPI AI translation endpoint
   */
  async translate(text: string, targetLanguage: string): Promise<TranslationApiResponse> {
    const res = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Translation failed (${res.status}): ${errText}`);
    }

    return await res.json();
  },

  /**
   * Generate natural speech using FastAPI AI TTS endpoint
   * Returns an audio Blob (audio/mpeg)
   */
  async getTTSAudioBlob(text: string, languageCode: string): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: languageCode,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TTS generation failed (${res.status}): ${errText}`);
    }

    return await res.blob();
  },
};
