"""
Kyma — motor Chatterbox (Resemble AI) en Modal — español LatAm + clonación + emoción.
=====================================================================================
Chatterbox Multilingual · MIT (pesos) → comercial OK, autohospedado. 23 idiomas incl
español; clona desde audio de referencia; control de exageración/emoción. ~500M, GPU L4.

DEPLOY: PYTHONIOENCODING=utf-8 PYTHONUTF8=1 modal deploy gpu/chatterbox_app.py
ENDPOINT: https://<workspace>--kyma-chatterbox-generate.modal.run
"""
import base64
import io
import os
import tempfile
import time

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install("chatterbox-tts", "fastapi[standard]")
    .env({"HF_HOME": "/cache"})
)

app = modal.App("kyma-chatterbox", image=image)
cache = modal.Volume.from_name("kyma-chatterbox-cache", create_if_missing=True)


@app.cls(gpu="L4", volumes={"/cache": cache}, scaledown_window=240, timeout=600)
class Chatterbox:
    @modal.enter()
    def load(self):
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        self.model = ChatterboxMultilingualTTS.from_pretrained(device="cuda")
        self.sr = self.model.sr

    @modal.method()
    def gen(self, payload: dict) -> dict:
        import torchaudio

        text = payload["text"]
        lang = payload.get("language_id", "es")
        exaggeration = float(payload.get("exaggeration", 0.5))
        cfg_weight = float(payload.get("cfg_weight", 0.5))

        ref_path = None
        ref_b64 = payload.get("reference_audio")
        if ref_b64:
            f = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            f.write(base64.b64decode(ref_b64))
            f.close()
            ref_path = f.name

        t0 = time.perf_counter()
        kwargs = {"language_id": lang, "exaggeration": exaggeration, "cfg_weight": cfg_weight}
        if ref_path:
            kwargs["audio_prompt_path"] = ref_path
        wav = self.model.generate(text, **kwargs)
        if ref_path:
            try:
                os.unlink(ref_path)
            except OSError:
                pass

        if hasattr(wav, "dim") and wav.dim() == 1:
            wav = wav.unsqueeze(0)
        buf = io.BytesIO()
        torchaudio.save(buf, wav.cpu(), self.sr, format="wav")
        return {
            "audio_base64": base64.b64encode(buf.getvalue()).decode(),
            "mime": "audio/wav",
            "sr": self.sr,
            "ms": int((time.perf_counter() - t0) * 1000),
        }


@app.function()
@modal.fastapi_endpoint(method="POST")
def generate(request: dict) -> dict:
    if not request.get("text"):
        return {"error": "Falta 'text'"}
    return Chatterbox().gen.remote(request)
