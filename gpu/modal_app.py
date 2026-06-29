"""
Kyma — GPU backend en Modal
============================
Despliega OmniVoice como endpoint serverless con TODAS las capacidades del
modelo expuestas: voice clone, voice design (instruct completo), tags
expresivos, control de velocidad/duración, calidad ajustable y multi-idioma.

DEPLOY
------
1. pip install modal
2. modal token set ...   (ya hecho)
3. modal deploy gpu/modal_app.py
   → copiá la URL en Vercel como OMNIVOICE_ENDPOINT

VARS EN VERCEL
--------------
INFERENCE_PROVIDER=modal
OMNIVOICE_ENDPOINT=https://<workspace>--kyma-generate.modal.run
"""

import base64
import io
import os
import subprocess
import tempfile
import time

import modal

# ─── Imagen Docker ────────────────────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.4.0",
        "torchaudio==2.4.0",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install("omnivoice", "soundfile", "numpy")
)

app = modal.App("kyma", image=image)

# Masterizado de audio con ffmpeg (mismo pipeline que la biblioteca).
_FILTER = (
    "highpass=f=70,"
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:detection=peak,areverse,"
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:detection=peak,areverse,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)


def _master_wav(wav_bytes: bytes, sample_rate: int) -> bytes:
    """Masteriza el WAV (highpass + recorte de silencios + loudnorm -16 LUFS).
    Si ffmpeg falla por lo que sea, devuelve el audio original — nunca rompe la generación."""
    try:
        p = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
             "-af", _FILTER, "-ar", str(sample_rate), "-ac", "1", "-sample_fmt", "s16", "-f", "wav", "pipe:1"],
            input=wav_bytes, capture_output=True, timeout=30,
        )
        if p.returncode == 0 and len(p.stdout) > 44:
            return p.stdout
    except Exception:
        pass
    return wav_bytes
model_cache = modal.Volume.from_name("kyma-model-cache", create_if_missing=True)

SAMPLE_RATE = 24000  # OmniVoice genera a 24 kHz

# ─── Mapeos UI → vocabulario real de OmniVoice ────────────────────────────
# (ver omnivoice/utils/voice_design.py)
AGE_MAP = {
    "child": "child",
    "teenager": "teenager",
    "young_adult": "young adult",
    "middle_aged": "middle-aged",
    "elderly": "elderly",
}
PITCH_MAP = {
    "very_low": "very low pitch",
    "low": "low pitch",
    "moderate": "moderate pitch",
    "high": "high pitch",
    "very_high": "very high pitch",
}
ACCENT_MAP = {
    "american": "american accent",
    "british": "british accent",
    "australian": "australian accent",
    "canadian": "canadian accent",
    "indian": "indian accent",
    "korean": "korean accent",
    "chinese": "chinese accent",
    "japanese": "japanese accent",
    "portuguese": "portuguese accent",
    "russian": "russian accent",
}
QUALITY_STEPS = {"fast": 16, "balanced": 24, "high": 32}


def build_instruct(design: dict, language: str) -> str:
    """Construye el string `instruct` que OmniVoice espera, respetando las
    reglas: acentos solo en inglés, dialectos solo en chino, un valor por
    categoría."""
    parts = []

    gender = design.get("gender")
    if gender in ("male", "female"):
        parts.append(gender)

    age = AGE_MAP.get(design.get("age", ""))
    if age:
        parts.append(age)

    pitch = PITCH_MAP.get(design.get("pitch", ""))
    if pitch:
        parts.append(pitch)

    if design.get("whisper"):
        parts.append("whisper")

    is_english = language.startswith("en")
    is_chinese = language.startswith("zh")

    # Acento solo si el idioma es inglés
    if is_english and design.get("accent"):
        accent = ACCENT_MAP.get(design["accent"])
        if accent:
            parts.append(accent)

    # Dialecto chino solo si el idioma es chino (ya viene en chino, va tal cual)
    if is_chinese and design.get("dialect"):
        parts.append(design["dialect"])

    return ", ".join(parts) if parts else "female, moderate pitch"


@app.cls(
    gpu="A10G",
    volumes={"/model_cache": model_cache},
    scaledown_window=300,
)
class OmniVoiceModel:

    @modal.enter()
    def load(self):
        import torch
        from omnivoice import OmniVoice

        self.model = OmniVoice.from_pretrained(
            "k2-fsa/OmniVoice",
            cache_dir="/model_cache",
            device_map="cuda:0",
            dtype=torch.float16,
            load_asr=True,  # Whisper integrado → ref_text opcional al clonar
        )

    @modal.method()
    def generate(self, payload: dict) -> dict:
        import torch
        import soundfile as sf

        text = payload["text"]
        language = payload.get("language", "es")
        mode = payload.get("mode", "design")
        design = payload.get("design") or {}
        reference_audio = payload.get("reference_audio")
        reference_text = payload.get("reference_text")
        speed = payload.get("speed")
        duration = payload.get("duration_sec")
        quality = payload.get("quality", "balanced")
        seed = payload.get("seed")

        start = time.perf_counter()

        if seed is not None:
            torch.manual_seed(int(seed))

        kwargs: dict = {
            "text": text,
            "num_step": QUALITY_STEPS.get(quality, 24),
        }

        # OmniVoice resuelve el idioma por código o nombre; mandamos el código
        # base (sin región) que es lo que el modelo entiende.
        kwargs["language"] = language.split("-")[0]

        if speed is not None:
            kwargs["speed"] = float(speed)
        if duration is not None:
            kwargs["duration"] = float(duration)

        ref_path = None
        if mode == "clone" and reference_audio:
            ref_bytes = base64.b64decode(reference_audio)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(ref_bytes)
                ref_path = f.name
            kwargs["ref_audio"] = ref_path
            if reference_text:
                kwargs["ref_text"] = reference_text
            # sin ref_text → Whisper lo transcribe solo
        else:
            kwargs["instruct"] = build_instruct(design, language)

        audio_list = self.model.generate(**kwargs)
        audio_array = audio_list[0]

        if ref_path:
            try:
                os.unlink(ref_path)
            except OSError:
                pass

        elapsed = time.perf_counter() - start
        duration_sec = len(audio_array) / SAMPLE_RATE

        buf = io.BytesIO()
        sf.write(buf, audio_array, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        wav_bytes = buf.getvalue()
        wav_bytes = _master_wav(wav_bytes, SAMPLE_RATE)

        return {
            "audio_base64": base64.b64encode(wav_bytes).decode(),
            "mime": "audio/wav",
            "duration_ms": int(duration_sec * 1000),
            "rtf": round(elapsed / duration_sec, 4) if duration_sec else 0,
        }


@app.function()
@modal.fastapi_endpoint(method="POST")
def generate(request: dict) -> dict:
    """
    POST /
    {
      "text": "Hola [laughter] mundo",
      "language": "es",
      "mode": "design" | "clone",
      "design": { "gender","age","pitch","whisper","accent","dialect" },
      "reference_audio": "<base64 WAV>",
      "reference_text": "transcripción opcional",
      "speed": 1.0,
      "duration_sec": null,
      "quality": "fast" | "balanced" | "high",
      "seed": 42
    }
    → { "audio_base64", "mime", "duration_ms", "rtf" }
    """
    model = OmniVoiceModel()
    return model.generate.remote(request)
