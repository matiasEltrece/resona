"""
Resona — GPU backend en Modal
==============================
Despliega OmniVoice como endpoint serverless. Se prende cuando llega un
request y se apaga solo → pagás solo por uso real.

PRERREQUISITOS
--------------
1. Crear cuenta en modal.com (gratis, incluye $30/mes de crédito)
2. pip install modal
3. modal setup           (autentica tu cuenta)
4. modal deploy gpu/modal_app.py
   → te da la URL del endpoint, copiala en .env.local como OMNIVOICE_ENDPOINT

CONFIGURACIÓN EN .env.local
-----------------------------
INFERENCE_PROVIDER=modal
OMNIVOICE_ENDPOINT=https://<tu-workspace>--resona-generate.modal.run
OMNIVOICE_API_KEY=          # opcional — ver sección de seguridad abajo
"""

import base64
import io
import os
import time

import modal

# ─── Imagen de Docker con dependencias ────────────────────────────────────
# Modal construye la imagen una vez y la cachea. Cambios acá requieren rebuild.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.8.0",
        "torchaudio==2.8.0",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .pip_install("omnivoice")  # instala desde PyPI
)

# ─── App Modal ────────────────────────────────────────────────────────────
app = modal.App("resona", image=image)

# Volumen persistente para cachear los pesos (evita re-descargar en cada cold-start)
model_cache = modal.Volume.from_name("resona-model-cache", create_if_missing=True)

# ─── Clase del modelo ─────────────────────────────────────────────────────
@app.cls(
    gpu="A10G",          # 24 GB VRAM · ~$0.00030/s en RunPod, ~$0.00044 en Modal
    # gpu="T4",          # más barato (16 GB) — descomentá para bajar costo si el modelo entra
    volumes={"/model_cache": model_cache},
    scaledown_window=300,      # se apaga si no hay requests por 5 minutos
    max_inputs=20,             # cola máxima por instancia
)
class OmniVoiceModel:
    @modal.enter()
    def load(self):
        """Se ejecuta una vez al arrancar el container (cold-start)."""
        import omnivoice
        self.model = omnivoice.load(
            cache_dir="/model_cache",  # reutiliza pesos descargados
        )

    @modal.method()
    def generate(
        self,
        text: str,
        language: str = "es",
        mode: str = "design",
        design: dict | None = None,
        reference_audio: str | None = None,  # base64
        seed: int | None = None,
    ) -> dict:
        import omnivoice

        start = time.perf_counter()

        params = dict(
            text=text,
            language=language,
            seed=seed,
        )

        if mode == "clone" and reference_audio:
            # Decodificamos el audio de referencia que viene en base64
            ref_bytes = base64.b64decode(reference_audio)
            params["reference_audio"] = ref_bytes
        elif design:
            params.update({
                "gender": design.get("gender", "female"),
                "age": design.get("age", "adult"),
                "pitch": design.get("pitch", "medium"),
                "style": design.get("style", "narration"),
                "emotion": design.get("emotion", "neutral"),
            })

        # OmniVoice devuelve un array numpy (float32, mono)
        audio_array, sample_rate = self.model.synthesize(**params)

        # Convertimos a WAV en memoria
        import wave, struct
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            pcm = [max(-32768, min(32767, int(s * 32767))) for s in audio_array]
            wf.writeframes(struct.pack(f"<{len(pcm)}h", *pcm))

        wav_bytes = buf.getvalue()
        elapsed = time.perf_counter() - start
        duration_sec = len(audio_array) / sample_rate

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
    Contrato del endpoint (mismo esquema que espera lib/inference/modal.ts):

    POST /
    {
        "text": "...",
        "language": "es",
        "mode": "design" | "clone",
        "design": { gender, age, pitch, style, emotion },
        "reference_audio": "<base64>",
        "seed": 42
    }
    → {
        "audio_base64": "...",
        "mime": "audio/wav",
        "duration_ms": 3200,
        "rtf": 0.025
    }
    """
    # Protección básica por API key (opcional)
    # api_key = os.environ.get("OMNIVOICE_API_KEY")
    # if api_key and request.get("_auth") != api_key:
    #     raise modal.exception.InvalidError("Unauthorized")

    model = OmniVoiceModel()
    return model.generate.remote(
        text=request["text"],
        language=request.get("language", "es"),
        mode=request.get("mode", "design"),
        design=request.get("design"),
        reference_audio=request.get("reference_audio"),
        seed=request.get("seed"),
    )
