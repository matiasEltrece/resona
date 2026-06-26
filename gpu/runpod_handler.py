"""
Resona — GPU backend en RunPod Serverless
==========================================
Alternativa a Modal si querés más control o menor costo a escala.

CÓMO USARLO
-----------
1. Crear cuenta en runpod.io
2. Ir a "Serverless" (NO a "Pods")
3. New Endpoint → Custom → usar este Dockerfile:

   FROM pytorch/pytorch:2.8.0-cuda12.8-cudnn9-runtime
   RUN pip install runpod omnivoice
   COPY runpod_handler.py /handler.py
   CMD ["python", "/handler.py"]

4. En la config del endpoint:
   - Container Disk: 30 GB (para los pesos)
   - GPU: RTX 4090 (24 GB) o A10G
   - Max Workers: 3 (ajustá según demanda)

5. Una vez activo, copiás la URL del endpoint en .env.local:
   INFERENCE_PROVIDER=modal
   OMNIVOICE_ENDPOINT=https://api.runpod.ai/v2/<endpoint-id>/runsync
   OMNIVOICE_API_KEY=<tu-runpod-api-key>

NOTA: el field OMNIVOICE_ENDPOINT para RunPod apunta a /runsync (síncrono).
lib/inference/modal.ts funciona tal cual porque acepta el mismo POST.
Si querés usar el polling asíncrono de RunPod (/run + /status),
creá un ModalProvider específico en lib/inference/runpod.ts siguiendo
el mismo patrón.
"""

import base64
import io
import struct
import time
import wave

import runpod
import omnivoice

# Cargamos el modelo una vez al arrancar el worker (no en cada request)
print("[Resona] Cargando OmniVoice…")
MODEL = omnivoice.load()
print("[Resona] Modelo listo.")


def handler(event: dict) -> dict:
    """
    RunPod llama a esta función con cada request.
    `event["input"]` es el body de la solicitud.
    """
    inp = event.get("input", {})

    text = inp.get("text", "")
    if not text.strip():
        return {"error": "Falta el texto"}

    language = inp.get("language", "es")
    mode = inp.get("mode", "design")
    design = inp.get("design", {})
    reference_audio_b64 = inp.get("reference_audio")
    seed = inp.get("seed")

    params: dict = dict(text=text, language=language)
    if seed is not None:
        params["seed"] = seed

    start = time.perf_counter()

    if mode == "clone" and reference_audio_b64:
        ref_bytes = base64.b64decode(reference_audio_b64)
        params["reference_audio"] = ref_bytes
    elif design:
        params.update({
            "gender": design.get("gender", "female"),
            "age": design.get("age", "adult"),
            "pitch": design.get("pitch", "medium"),
            "style": design.get("style", "narration"),
            "emotion": design.get("emotion", "neutral"),
        })

    audio_array, sample_rate = MODEL.synthesize(**params)

    # WAV en memoria
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


runpod.serverless.start({"handler": handler})
