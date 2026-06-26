"""
Kyma — GPU backend en Modal
============================
Despliega OmniVoice como endpoint serverless. Se prende cuando llega un
request y se apaga solo → pagás solo por uso real.

PRERREQUISITOS
--------------
1. Crear cuenta en modal.com (gratis, incluye $30/mes de crédito)
2. pip install modal
3. modal setup           (autentica tu cuenta)
4. modal deploy gpu/modal_app.py
   → te da la URL del endpoint; copiala en Vercel como OMNIVOICE_ENDPOINT

VARS EN VERCEL DESPUÉS DEL DEPLOY
-----------------------------------
INFERENCE_PROVIDER=modal
OMNIVOICE_ENDPOINT=https://<workspace>--kyma-generate.modal.run
"""

import base64
import io
import os
import tempfile
import time

import modal

# ─── Imagen Docker ────────────────────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.4.0",
        "torchaudio==2.4.0",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "omnivoice",
        "soundfile",
        "numpy",
    )
)

app = modal.App("kyma", image=image)

# Volumen para cachear pesos (~20 GB). Se descarga una sola vez.
model_cache = modal.Volume.from_name("kyma-model-cache", create_if_missing=True)

SAMPLE_RATE = 24000  # OmniVoice genera a 24 kHz


# ─── Clase del modelo ─────────────────────────────────────────────────────
@app.cls(
    gpu="A10G",               # 24 GB VRAM — recomendado para OmniVoice
    # gpu="T4",               # 16 GB — más barato, puede quedarse sin VRAM
    volumes={"/model_cache": model_cache},
    scaledown_window=300,     # se apaga a los 5 min sin requests
    max_inputs=10,
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
            load_asr=True,    # Whisper integrado → ref_text es opcional en clone
        )

    @modal.method()
    def generate(
        self,
        text: str,
        language: str = "es",
        mode: str = "design",
        design: dict | None = None,
        reference_audio: str | None = None,   # base64 WAV/MP3
        seed: int | None = None,
    ) -> dict:
        import numpy as np
        import soundfile as sf
        import torch

        start = time.perf_counter()

        kwargs: dict = {"text": text}

        if seed is not None:
            torch.manual_seed(seed)

        if mode == "clone" and reference_audio:
            # Escribimos el audio de referencia a un archivo temporal
            ref_bytes = base64.b64decode(reference_audio)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(ref_bytes)
                ref_path = f.name
            kwargs["ref_audio"] = ref_path
            # ref_text omitido → Whisper lo transcribe automáticamente

        elif mode == "design" and design:
            # Construimos el string de instrucción para voice design
            parts = []
            if design.get("gender"):
                parts.append(design["gender"])
            if design.get("age") and design["age"] != "adult":
                parts.append(design["age"])
            if design.get("pitch") and design["pitch"] != "medium":
                pitch_map = {
                    "very_low": "very low pitch",
                    "low": "low pitch",
                    "high": "high pitch",
                    "very_high": "very high pitch",
                }
                parts.append(pitch_map.get(design["pitch"], design["pitch"] + " pitch"))
            if design.get("style") and design["style"] not in ("narration", ""):
                parts.append(design["style"])
            if design.get("emotion") and design["emotion"] != "neutral":
                parts.append(design["emotion"])
            kwargs["instruct"] = ", ".join(parts) if parts else "female, moderate pitch"

        # Síntesis
        audio_list = self.model.generate(**kwargs)
        audio_array = audio_list[0]  # numpy float32, forma (T,)

        # Limpieza del archivo temporal
        if "ref_audio" in kwargs:
            try:
                os.unlink(kwargs["ref_audio"])
            except OSError:
                pass

        elapsed = time.perf_counter() - start
        duration_sec = len(audio_array) / SAMPLE_RATE

        # Convertir numpy → WAV en memoria
        buf = io.BytesIO()
        sf.write(buf, audio_array, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        wav_bytes = buf.getvalue()

        return {
            "audio_base64": base64.b64encode(wav_bytes).decode(),
            "mime": "audio/wav",
            "duration_ms": int(duration_sec * 1000),
            "rtf": round(elapsed / duration_sec, 4) if duration_sec else 0,
        }


# ─── Endpoint HTTP ────────────────────────────────────────────────────────
@app.function()
@modal.web_endpoint(method="POST")
def generate(request: dict) -> dict:
    """
    POST /
    {
        "text": "...",
        "language": "es",
        "mode": "design" | "clone",
        "design": { "gender": "female", "age": "adult", "pitch": "medium",
                    "style": "narration", "emotion": "neutral" },
        "reference_audio": "<base64 WAV>",
        "seed": 42
    }
    → {
        "audio_base64": "...",
        "mime": "audio/wav",
        "duration_ms": 3200,
        "rtf": 0.025
    }
    """
    model = OmniVoiceModel()
    return model.generate.remote(
        text=request["text"],
        language=request.get("language", "es"),
        mode=request.get("mode", "design"),
        design=request.get("design"),
        reference_audio=request.get("reference_audio"),
        seed=request.get("seed"),
    )
