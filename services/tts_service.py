import os
import io
import asyncio
import logging
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("tts_service")

# Map language codes/names to edge-tts neural voices
EDGE_TTS_VOICES: Dict[str, str] = {
    "en": "en-IN-NeerjaNeural",
    "en-us": "en-US-JennyNeural",
    "en-in": "en-IN-NeerjaNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-in": "ta-IN-PallaviNeural",
    "tamil": "ta-IN-PallaviNeural",
    "hi": "hi-IN-SwaraNeural",
    "hi-in": "hi-IN-SwaraNeural",
    "hindi": "hi-IN-SwaraNeural",
    "ml": "ml-IN-SobhanaNeural",
    "ml-in": "ml-IN-SobhanaNeural",
    "malayalam": "ml-IN-SobhanaNeural",
    "te": "te-IN-ShrutiNeural",
    "te-in": "te-IN-ShrutiNeural",
    "telugu": "te-IN-ShrutiNeural",
    "kn": "kn-IN-SapnaNeural",
    "kn-in": "kn-IN-SapnaNeural",
    "kannada": "kn-IN-SapnaNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bn-in": "bn-IN-TanishaaNeural",
    "bengali": "bn-IN-TanishaaNeural",
    "mr": "mr-IN-AarohiNeural",
    "mr-in": "mr-IN-AarohiNeural",
    "marathi": "mr-IN-AarohiNeural",
}

# Map language codes to gTTS language codes
GTTS_LANG_CODES: Dict[str, str] = {
    "en": "en",
    "en-us": "en",
    "en-in": "en",
    "ta": "ta",
    "ta-in": "ta",
    "tamil": "ta",
    "hi": "hi",
    "hi-in": "hi",
    "hindi": "hi",
    "ml": "ml",
    "ml-in": "ml",
    "malayalam": "ml",
    "te": "te",
    "te-in": "te",
    "telugu": "te",
    "kn": "kn",
    "kn-in": "kn",
    "kannada": "kn",
    "bn": "bn",
    "bn-in": "bn",
    "bengali": "bn",
    "mr": "mr",
    "mr-in": "mr",
    "marathi": "mr",
}

class TTSService:
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.provider = os.getenv("AI_PROVIDER", "edge-tts").lower()
        self.tts_model = os.getenv("AI_TTS_MODEL", "tts-1")

    async def _generate_with_edge_tts(self, text: str, lang_key: str) -> Optional[bytes]:
        """Generate audio using Microsoft Neural Voices via edge-tts."""
        try:
            import edge_tts
            voice = EDGE_TTS_VOICES.get(lang_key.lower(), "en-IN-NeerjaNeural")
            communicate = edge_tts.Communicate(text, voice)
            audio_data = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.extend(chunk["data"])
            if audio_data:
                return bytes(audio_data)
        except Exception as e:
            logger.warning(f"edge-tts generation failed: {e}")
        return None

    def _generate_with_gtts(self, text: str, lang_key: str) -> Optional[bytes]:
        """Generate audio using Google TTS as fallback."""
        try:
            from gtts import gTTS
            lang_code = GTTS_LANG_CODES.get(lang_key.lower(), "en")
            # For gTTS, tld='co.in' gives natural Indian accent
            tts = gTTS(text=text, lang=lang_code, tld="co.in", slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as e:
            logger.warning(f"gTTS fallback failed: {e}")
        return None

    def _generate_with_openai(self, text: str) -> Optional[bytes]:
        """Generate audio using OpenAI TTS if API key provided."""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            response = client.audio.speech.create(
                model=self.tts_model if "tts" in self.tts_model else "tts-1",
                voice="alloy",
                input=text
            )
            return response.content
        except Exception as e:
            logger.warning(f"OpenAI TTS failed: {e}")
        return None

    async def generate_speech(self, text: str, language: str = "en-US") -> bytes:
        """
        Generates MP3 audio for the given text in the requested language.
        Returns bytes of audio/mpeg.
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for TTS generation")

        cleaned_text = text.strip()
        lang_key = language.strip().lower()

        # 1. If OpenAI configured explicitly
        if self.api_key and "openai" in self.provider and self.api_key != "YOUR_SECRET_KEY":
            audio_bytes = self._generate_with_openai(cleaned_text)
            if audio_bytes:
                return audio_bytes

        # 2. Try Edge Neural TTS (Best Indian languages natural voices)
        audio_bytes = await self._generate_with_edge_tts(cleaned_text, lang_key)
        if audio_bytes:
            return audio_bytes

        # 3. Fallback to gTTS
        audio_bytes = self._generate_with_gtts(cleaned_text, lang_key)
        if audio_bytes:
            return audio_bytes

        raise RuntimeError(f"Failed to generate speech for language '{language}'")

tts_service = TTSService()
