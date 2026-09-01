import { api } from './api';

class TranslationService {
  private cache: Map<string, string> = new Map();

  private getCacheKey(text: string, targetLanguage: string): string {
    return `${text.trim()}:::${targetLanguage.trim().toLowerCase()}`;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text || !text.trim()) {
      return '';
    }

    const trimmed = text.trim();
    if (targetLanguage.toLowerCase() === 'english' && /^[\x00-\x7F]*$/.test(trimmed)) {
      return trimmed;
    }

    const key = this.getCacheKey(trimmed, targetLanguage);
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const response = await api.translate(trimmed, targetLanguage);
      const translated = response.translated_text || trimmed;
      this.cache.set(key, translated);
      return translated;
    } catch (err) {
      console.warn('Translation service error:', err);
      throw err;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();
