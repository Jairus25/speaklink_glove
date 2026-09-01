from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import requests
import threading
import time
import os
from dotenv import load_dotenv

from services.translation_service import translation_service
from services.tts_service import tts_service

load_dotenv()

app = FastAPI(
    title="Smart Glove AI Assistive Communication Backend",
    version="1.0.0"
)

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# SUPABASE CONFIG
# =========================

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vniwpphrnuhhyhauuepq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_secret_BpRz-kyzy3bVYee7KnfGKQ_4k-08Od1")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "smartglove_data")

supabase_url = f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

# =========================
# STORE LATEST DATA
# =========================

latest_data = None
last_id = 0

# =========================
# READ SUPABASE (PRESERVED PIPELINE)
# =========================

def read_supabase():
    global latest_data
    global last_id

    print("Supabase reader started...")

    while True:
        try:
            params = {
                "select": "*",
                "id": f"gt.{last_id}",
                "order": "id.asc"
            }

            response = requests.get(
                supabase_url,
                headers=headers,
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                print("Supabase error:")
                print(response.text)
            else:
                rows = response.json()
                for row in rows:
                    latest_data = row
                    last_id = row["id"]

                    print("\n===== NEW SMART GLOVE INPUT =====")
                    print("Event    :", row.get("event"))
                    print("RFID UID :", row.get("rfid_uid"))
                    print("User     :", row.get("user_name"))
                    print("Mode     :", row.get("mode"))
                    print("Input    :", row.get("input"))
                    print("Timestamp:", row.get("timestamp"))
                    print("==================================")

        except Exception as e:
            print("Error reading Supabase:", e)

        time.sleep(2)


# =========================
# REQUEST & RESPONSE MODELS
# =========================

class TranslationRequest(BaseModel):
    text: str = Field(..., description="Original input message from Smart Glove")
    target_language: str = Field(..., description="Target Indian language e.g. Tamil, Hindi, Malayalam, etc.")

class TranslationResponse(BaseModel):
    translated_text: str
    language: str

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to convert into speech")
    language: Optional[str] = Field("en-US", description="Language code e.g. ta-IN, hi-IN, ml-IN, etc.")


# =========================
# API ENDPOINTS
# =========================

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Smart Glove AI backend is running"
    }


@app.get("/latest")
async def get_latest():
    """
    Returns latest ingested Smart Glove reading.
    Matches exact structure required by frontend.
    """
    return {
        "status": "success",
        "data": latest_data
    }


@app.post("/translate", response_model=TranslationResponse)
async def translate_text(req: TranslationRequest):
    """
    AI Translation endpoint.
    Translates only user message into target Indian language.
    """
    try:
        result = translation_service.translate(req.text, req.target_language)
        return TranslationResponse(
            translated_text=result["translated_text"],
            language=result["language"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    """
    AI Text to Speech endpoint.
    Returns audio/mpeg stream directly playable in browser.
    """
    try:
        audio_bytes = await tts_service.generate_speech(req.text, req.language or "en-US")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Content-Disposition": "inline; filename=smartglove_speech.mp3",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


# =========================
# START SUPABASE READER
# =========================

@app.on_event("startup")
async def startup_event():
    thread = threading.Thread(
        target=read_supabase,
        daemon=True
    )
    thread.start()