"""
Kyma — motor "Flash" (Kokoro 82M) en Modal — BAKE-OFF / candidato a voces listas.
=================================================================================
Kokoro-82M (hexgrad) · Apache 2.0 (código y pesos) → uso comercial OK, sin clonar a nadie.
Corre en CPU (modelo chico) → costo ~nulo. Voces español: ef_dora (fem), em_alex / em_santa (masc).

DEPLOY:  PYTHONIOENCODING=utf-8 PYTHONUTF8=1 modal deploy gpu/kokoro_app.py
ENDPOINT:  https://<workspace>--kyma-kokoro-generate.modal.run
"""
import base64
import io
import os
import time

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("espeak-ng")  # G2P para español (misaki usa espeak-ng como fallback)
    .pip_install("torch", extra_index_url="https://download.pytorch.org/whl/cpu")
    .pip_install("kokoro>=0.9.2", "soundfile", "numpy", "fastapi[standard]")
    .env({"HF_HOME": "/cache"})
)

app = modal.App("kyma-kokoro", image=image)
cache = modal.Volume.from_name("kyma-kokoro-cache", create_if_missing=True)

SAMPLE_RATE = 24000
ES_VOICES = ["ef_dora", "em_alex", "em_santa"]  # voces español disponibles en Kokoro


@app.cls(volumes={"/cache": cache}, scaledown_window=300)
class Kokoro:
    @modal.enter()
    def load(self):
        from kokoro import KPipeline
        # lang_code 'e' = español
        self.pipe = KPipeline(lang_code="e")

    @modal.method()
    def gen(self, payload: dict) -> dict:
        import numpy as np
        import soundfile as sf

        text = payload["text"]
        voice = payload.get("voice", "ef_dora")
        start = time.perf_counter()

        chunks = []
        for _, _, a in self.pipe(text, voice=voice):
            arr = a.detach().cpu().numpy() if hasattr(a, "detach") else np.asarray(a)
            chunks.append(arr.astype("float32"))
        wav = np.concatenate(chunks) if chunks else np.zeros(1, dtype="float32")

        buf = io.BytesIO()
        sf.write(buf, wav, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        wav_bytes = buf.getvalue()
        dur = len(wav) / SAMPLE_RATE
        return {
            "audio_base64": base64.b64encode(wav_bytes).decode(),
            "mime": "audio/wav",
            "duration_ms": int(dur * 1000),
            "rtf": round((time.perf_counter() - start) / dur, 4) if dur else 0,
            "voice": voice,
        }


@app.function()
@modal.fastapi_endpoint(method="POST")
def generate(request: dict) -> dict:
    """POST / {"text": "...", "voice": "ef_dora"} → {audio_base64, mime, duration_ms, rtf, voice}"""
    if not request.get("text"):
        return {"error": "Falta 'text'"}
    voice = request.get("voice", "ef_dora")
    if voice not in ES_VOICES:
        voice = "ef_dora"
    return Kokoro().gen.remote({"text": request["text"], "voice": voice})
