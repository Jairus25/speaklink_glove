import os
import logging
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("translation_service")

# Map supported language names to ISO 639-1 codes & full names
SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "english": {"code": "en", "locale": "en-US", "name": "English", "native": "English"},
    "tamil": {"code": "ta", "locale": "ta-IN", "name": "Tamil", "native": "தமிழ்"},
    "hindi": {"code": "hi", "locale": "hi-IN", "name": "Hindi", "native": "हिन्दी"},
    "malayalam": {"code": "ml", "locale": "ml-IN", "name": "Malayalam", "native": "മലയാളം"},
    "telugu": {"code": "te", "locale": "te-IN", "name": "Telugu", "native": "తెలుగు"},
    "kannada": {"code": "kn", "locale": "kn-IN", "name": "Kannada", "native": "ಕನ್ನಡ"},
    "bengali": {"code": "bn", "locale": "bn-IN", "name": "Bengali", "native": "বাংলা"},
    "marathi": {"code": "mr", "locale": "mr-IN", "name": "Marathi", "native": "मराठी"},
}

def normalize_language(lang_input: str) -> Optional[Dict[str, str]]:
    """Normalize language input (name, code, or locale) to language info dict."""
    if not lang_input:
        return None
    cleaned = lang_input.strip().lower()
    
    # Check by key (name)
    if cleaned in SUPPORTED_LANGUAGES:
        return SUPPORTED_LANGUAGES[cleaned]
    
    # Check by code or locale
    for key, info in SUPPORTED_LANGUAGES.items():
        if cleaned == info["code"].lower() or cleaned == info["locale"].lower() or cleaned == info["name"].lower():
            return info
            
    return None

class TranslationService:
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.provider = os.getenv("AI_PROVIDER", "gemini").lower()
        self.model = os.getenv("AI_TRANSLATION_MODEL", "gemini-2.5-flash")

    def _translate_with_gemini(self, text: str, target_lang_name: str) -> Optional[str]:
        """Translate using Google GenAI / Gemini API if configured."""
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            prompt = (
                f"You are an assistive communication translator for a healthcare Smart Glove device. "
                f"Translate the following user message accurately into {target_lang_name}. "
                f"Preserve the precise tone and meaning of the original message. "
                f"Do not translate or add any names, RFID codes, or timestamps. "
                f"Return ONLY the translated sentence, without any explanations, prefixes, quotes, or markdown formatting.\n\n"
                f"Message: {text}"
            )
            response = client.models.generate_content(
                model=self.model if "gemini" in self.model else "gemini-2.5-flash",
                contents=prompt
            )
            if response and response.text:
                return response.text.strip().strip('"').strip("'")
        except Exception as e:
            logger.warning(f"Gemini translation failed: {e}")
        return None

    def _translate_with_openai(self, text: str, target_lang_name: str) -> Optional[str]:
        """Translate using OpenAI API if configured."""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            prompt = (
                f"You are an assistive communication translator for a healthcare Smart Glove device. "
                f"Translate the following user message directly into {target_lang_name}. "
                f"Preserve meaning and context. Return ONLY the translated string without quotes or explanations.\n\n"
                f"Message: {text}"
            )
            response = client.chat.completions.create(
                model=self.model if "gpt" in self.model else "gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip().strip('"').strip("'")
        except Exception as e:
            logger.warning(f"OpenAI translation failed: {e}")
        return None

    def _translate_with_fallback(self, text: str, target_lang_code: str) -> str:
        """Translate using Google Translate engine with MyMemory backup and error filtering."""
        # 1. Try Google Translator
        try:
            from deep_translator import GoogleTranslator
            translated = GoogleTranslator(source='auto', target=target_lang_code).translate(text)
            if translated and not ("<html" in translated.lower() or "error 500" in translated.lower() or "server error" in translated.lower()):
                return translated.strip()
        except Exception as e:
            logger.warning(f"GoogleTranslator fallback failed: {e}")

        # 2. Try MyMemory Translator
        try:
            from deep_translator import MyMemoryTranslator
            translated = MyMemoryTranslator(source='en', target=target_lang_code).translate(text)
            if translated and not ("<html" in translated.lower() or "error" in translated.lower() or "MYMEMORY" in translated):
                return translated.strip()
        except Exception as e:
            logger.warning(f"MyMemoryTranslator fallback failed: {e}")

        return text

    def translate(self, text: str, target_language: str) -> Dict[str, str]:
        """
        Translates input text into target language.
        Returns dict with translated_text and language name.
        """
        if not text or not text.strip():
            return {"translated_text": "", "language": target_language}

        lang_info = normalize_language(target_language)
        target_name = lang_info["name"] if lang_info else target_language
        target_code = lang_info["code"] if lang_info else "en"

        # If already English and target is English, return original
        if target_code == "en" and text.isascii():
            return {"translated_text": text.strip(), "language": target_name}

        translated_result = None

        # 1. Try configured AI provider if API key present
        if self.api_key and self.api_key != "YOUR_SECRET_KEY":
            if "openai" in self.provider or "gpt" in self.model:
                translated_result = self._translate_with_openai(text, target_name)
            else:
                translated_result = self._translate_with_gemini(text, target_name)

        # 2. Fallback to robust neural translator
        if not translated_result:
            translated_result = self._translate_with_fallback(text, target_code)

        return {
            "translated_text": translated_result or text,
            "language": target_name
        }

translation_service = TranslationService()
