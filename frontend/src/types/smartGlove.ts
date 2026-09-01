export interface SmartGloveData {
  id?: number;
  event: string;
  rfid_uid: string;
  user_name: string;
  mode: string;
  input: string;
  timestamp?: string;
  created_at?: string;
  is_sos?: boolean;
}

export type BackendConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface LanguageOption {
  code: string;
  locale: string;
  name: string;
  native: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', locale: 'en-US', name: 'English', native: 'English' },
  { code: 'ta', locale: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', locale: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ml', locale: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'te', locale: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', locale: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', locale: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', locale: 'mr-IN', name: 'Marathi', native: 'मराठी' },
];

export interface MessageHistoryItem {
  id: string;
  event: string;
  rfid_uid: string;
  user_name: string;
  mode: string;
  input: string;
  timestamp: string;
  is_sos: boolean;
  translated_text?: string;
  language?: string;
  speechGenerated?: boolean;
}

export type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
