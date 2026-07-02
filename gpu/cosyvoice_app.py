"""
Kyma — motor CosyVoice2-0.5B (Alibaba FunAudioLLM) en Modal — multilingüe + clonación.
=====================================================================================
CosyVoice2-0.5B · Apache-2.0 (código y pesos) → comercial OK, autohospedado. 9 idiomas
incl español; clona zero-shot + cross-lingual + instruct (emoción/estilo). GPU L4.

Usa la MISMA imagen base que el Dockerfile oficial (pytorch/pytorch:2.0.1-cuda11.7) que
trae torch + setuptools viejo con pkg_resources → evita el infierno de deps que rompe en
imágenes modernas (pynini/openai-whisper/pkg_resources).

DEPLOY: PYTHONIOENCODING=utf-8 PYTHONUTF8=1 modal deploy gpu/cosyvoice_app.py
ENDPOINT: https://<workspace>--kyma-cosyvoice-generate.modal.run
"""
import base64
import io
import os
import tempfile
import time

import modal

REPO = "/opt/CosyVoice"
CKPT = f"{REPO}/pretrained_models/CosyVoice2-0.5B"

image = (
    modal.Image.from_registry("pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime")
    # noninteractive + TZ preseteado → evita el prompt de tzdata que cuelga el apt install
    .env({"DEBIAN_FRONTEND": "noninteractive", "TZ": "Etc/UTC"})
    .apt_install("git", "unzip", "git-lfs", "g++", "build-essential", "ffmpeg", "sox", "libsox-dev", "wget", "tzdata")
    .run_commands(
        "git lfs install",
        f"git clone --recursive https://github.com/FunAudioLLM/CosyVoice.git {REPO}",
        f"cd {REPO} && git submodule update --init --recursive",
    )
    # pip arma un build-env aislado con setuptools nuevo (≥81, sin pkg_resources) que rompe
    # los wheels viejos (openai-whisper, pynini). PIP_CONSTRAINT fuerza setuptools<81 en ESE build-env.
    .run_commands("printf 'setuptools<81\\n' > /opt/pipc.txt")
    .run_commands(f"cd {REPO} && PIP_CONSTRAINT=/opt/pipc.txt pip install -r requirements.txt --no-cache-dir")
    # deepspeed (de requirements) intenta compilar ops CUDA al importar y crashea en imagen runtime;
    # no se usa para inferencia (load_jit/load_trt=False) → fuera.
    .run_commands("pip uninstall -y deepspeed")
    .run_commands(
        f"cd {REPO} && python -c \"from huggingface_hub import snapshot_download; "
        f"snapshot_download('FunAudioLLM/CosyVoice2-0.5B', local_dir='{CKPT}')\""
    )
    .pip_install("fastapi[standard]")
)

app = modal.App("kyma-cosyvoice", image=image)


@app.cls(gpu="L4", scaledown_window=240, timeout=900)
class Cosy:
    @modal.enter()
    def load(self):
        import logging
        logging.disable(logging.INFO)  # CosyVoice/modelscope pone el root logger en DEBUG → inunda y cuelga el endpoint
        import os
        os.environ.setdefault("CUDA_HOME", "/usr/local/cuda")  # por si algo lo busca (deepspeed ya está fuera)
        import sys
        sys.path.append(REPO)
        sys.path.append(f"{REPO}/third_party/Matcha-TTS")
        from cosyvoice.cli.cosyvoice import CosyVoice2
        self.model = CosyVoice2(CKPT, load_jit=False, load_trt=False, fp16=False)
        self.sr = self.model.sample_rate

    @modal.method()
    def gen(self, payload: dict) -> dict:
        import logging
        logging.disable(logging.INFO)
        import sys
        sys.path.append(REPO)
        sys.path.append(f"{REPO}/third_party/Matcha-TTS")
        import torch
        import torchaudio
        from cosyvoice.utils.file_utils import load_wav

        text = payload["text"]
        ref_b64 = payload.get("reference_audio")
        ref_text = payload.get("reference_text", "")
        instruct = payload.get("instruct")

        t0 = time.perf_counter()
        ref_path = None
        chunks = []
        try:
            if not ref_b64:
                return {"error": "CosyVoice2 requiere un audio de referencia (reference_audio)."}
            f = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            f.write(base64.b64decode(ref_b64))
            f.close()
            ref_path = f.name
            # esta versión de CosyVoice carga el prompt internamente → se le pasa el PATH, no un tensor
            if instruct:
                gen = self.model.inference_instruct2(text, instruct, ref_path, stream=False)
            elif ref_text:
                gen = self.model.inference_zero_shot(text, ref_text, ref_path, stream=False)
            else:
                gen = self.model.inference_cross_lingual(text, ref_path, stream=False)
            for j in gen:
                chunks.append(j["tts_speech"])

            import numpy as np  # noqa
            import soundfile as sf
            wav = torch.concat(chunks, dim=1) if len(chunks) > 1 else chunks[0]
            arr = wav.cpu().numpy().squeeze()
            buf = io.BytesIO()
            sf.write(buf, arr, self.sr, format="WAV", subtype="PCM_16")
            return {
                "audio_base64": base64.b64encode(buf.getvalue()).decode(),
                "mime": "audio/wav",
                "sr": self.sr,
                "ms": int((time.perf_counter() - t0) * 1000),
            }
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            return {"error": repr(e), "trace": tb[:1600] + "\n...[snip]...\n" + tb[-700:]}
        finally:
            if ref_path:
                try:
                    os.unlink(ref_path)
                except OSError:
                    pass


@app.function()
@modal.fastapi_endpoint(method="POST")
def generate(request: dict) -> dict:
    if not request.get("text"):
        return {"error": "Falta 'text'"}
    return Cosy().gen.remote(request)


@app.function(gpu="L4", timeout=900)
def debug_load():
    """`modal run gpu/cosyvoice_app.py::debug_load` → imprime el traceback REAL del load,
    sin el ruido de DEBUG que tapa `modal app logs`."""
    import logging
    logging.disable(logging.INFO)  # mata el spam de grpc/hpack DEBUG
    import os
    import sys
    import traceback
    os.environ.setdefault("CUDA_HOME", "/usr/local/cuda")
    sys.path.append(REPO)
    sys.path.append(f"{REPO}/third_party/Matcha-TTS")
    try:
        from cosyvoice.cli.cosyvoice import CosyVoice2
        m = CosyVoice2(CKPT, load_jit=False, load_trt=False, fp16=False)
        print(">>> LOAD OK · sample_rate =", m.sample_rate)
    except Exception:
        print(">>> LOAD FAILED:\n" + traceback.format_exc())
