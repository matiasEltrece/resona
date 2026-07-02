"""
Kyma — ComfyUI en Modal (estudio de video IA: avatar que habla + videos musicales).
=====================================================================================
GUI persistente + modelos en VOLUMEN (no inflan la imagen, se suman sin rebuild).
Trae: Flux.1-schnell (Apache, imagen) + LTX 2.3 (LTX-2 Community License, comercial
<$10M facturación) para video con personaje consistente. Nodos: 10S + KJNodes.

USO:
  1) modal run gpu/comfyui_app.py::setup_models   # baja modelos al volumen (1 vez, lento)
  2) modal deploy gpu/comfyui_app.py              # levanta la GUI
URL GUI: la imprime el deploy (web function 'ui'). Cerrá la pestaña al terminar.
"""
import subprocess

import modal

CN = "/root/comfy/ComfyUI/custom_nodes"
VOL_PATH = "/ltxmodels"  # volumen con los modelos (vía extra_model_paths)
vol = modal.Volume.from_name("kyma-comfyui-models", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg", "libgl1", "libglib2.0-0", "wget", "unzip")
    .pip_install("comfy-cli", "huggingface_hub[hf_transfer]")
    .run_commands("comfy --skip-prompt install --fast-deps --nvidia")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    # Flux.1-schnell fp8 (Apache) — imagen — va en la IMAGEN (chico, base)
    .run_commands(
        "comfy --skip-prompt model download "
        "--url https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors "
        "--relative-path models/checkpoints"
    )
    # Custom nodes: 10S (personaje consistente) + KJNodes + PuLID-Flux (identidad) + FluxTrainer (LoRA)
    .run_commands(
        f"cd {CN} && git clone https://github.com/TenStrip/10S-Comfy-nodes.git || true",
        f"cd {CN} && git clone https://github.com/kijai/ComfyUI-KJNodes.git || true",
        f"cd {CN} && git clone https://github.com/sipie800/ComfyUI-PuLID-Flux-Enhanced.git || true",
        f"cd {CN} && git clone https://github.com/kijai/ComfyUI-FluxTrainer.git || true",
        "pip install mediapipe",
        f"pip install -r {CN}/ComfyUI-KJNodes/requirements.txt || true",
        # deps de PuLID (identidad): face analysis + clip
        "pip install facexlib insightface onnxruntime-gpu timm || true",
        f"pip install -r {CN}/ComfyUI-FluxTrainer/requirements.txt || true",
    )
    # antelopev2 (detección de cara para PuLID) — el nodo NO lo baja solo
    .run_commands(
        "mkdir -p /root/comfy/ComfyUI/models/insightface/models",
        "wget -q https://huggingface.co/MonsterMMORPG/tools/resolve/main/antelopev2.zip -O /tmp/a.zip "
        "|| wget -q https://github.com/deepinsight/insightface/releases/download/v0.7/antelopev2.zip -O /tmp/a.zip",
        "unzip -o /tmp/a.zip -d /root/comfy/ComfyUI/models/insightface/models/ && rm /tmp/a.zip",
    )
)

app = modal.App("kyma-comfyui", image=image)

# Archivos de LTX 2.3 → (repo, archivo, subcarpeta destino en el volumen)
LTX_FILES = [
    ("Kijai/LTX2.3_comfy", "diffusion_models/ltx-2.3-22b-distilled-1.1_transformer_only_fp8_scaled.safetensors", "unet"),
    ("Kijai/LTX2.3_comfy", "vae/LTX23_audio_vae_bf16.safetensors", "vae"),
    ("Kijai/LTX2.3_comfy", "vae/LTX23_video_vae_bf16.safetensors", "vae"),
    ("Kijai/LTX2.3_comfy", "vae/taeltx2_3.safetensors", "vae"),
    ("Lightricks/LTX-2.3", "ltx-2.3-spatial-upscaler-x2-1.1.safetensors", "latent_upscale_models"),
    ("Comfy-Org/ltx-2", "split_files/text_encoders/gemma_3_12B_it.safetensors", "text_encoders"),
    ("Kijai/LTX2.3_comfy", "text_encoders/ltx-2.3_text_projection_bf16.safetensors", "text_encoders"),
]


@app.function(volumes={VOL_PATH: vol}, timeout=7200)
def setup_models():
    """Baja los modelos de LTX 2.3 al volumen (1 sola vez). `modal run ...::setup_models`."""
    import os
    import shutil
    from huggingface_hub import hf_hub_download
    for sub in ("unet", "vae", "text_encoders", "latent_upscale_models", "checkpoints"):
        os.makedirs(f"{VOL_PATH}/{sub}", exist_ok=True)
    for repo, fname, sub in LTX_FILES:
        dest = f"{VOL_PATH}/{sub}/{os.path.basename(fname)}"
        if os.path.exists(dest):
            print(f"ya está: {dest}")
            continue
        print(f"bajando {repo}/{fname} → {sub}/")
        p = hf_hub_download(repo, fname)
        shutil.copy(p, dest)
        vol.commit()  # commit por archivo → si se corta, no se pierde lo bajado
        print(f"  ✓ {dest}")
    print(">>> modelos LTX listos en el volumen")


@app.function(volumes={VOL_PATH: vol}, timeout=3600)
def setup_pulid():
    """Baja los pesos de PuLID-Flux al volumen (identidad para el dataset del LoRA)."""
    import os
    import shutil
    from huggingface_hub import hf_hub_download
    os.makedirs(f"{VOL_PATH}/pulid", exist_ok=True)
    dest = f"{VOL_PATH}/pulid/pulid_flux_v0.9.1.safetensors"
    if not os.path.exists(dest):
        p = hf_hub_download("guozinan/PuLID", "pulid_flux_v0.9.1.safetensors")
        shutil.copy(p, dest)
        vol.commit()
    print(">>> PuLID-Flux listo:", dest)


def _extra_paths_yaml() -> str:
    return (
        "ltx:\n"
        f"  base_path: {VOL_PATH}\n"
        "  unet: unet\n"
        "  vae: vae\n"
        "  text_encoders: text_encoders\n"
        "  latent_upscale_models: latent_upscale_models\n"
        "  checkpoints: checkpoints\n"
        "  pulid: pulid\n"
    )


@app.function(gpu="L4", volumes={VOL_PATH: vol}, timeout=3600, scaledown_window=180, max_containers=1)
@modal.concurrent(max_inputs=10)
@modal.web_server(8000, startup_timeout=240)
def ui():
    with open("/root/extra_model_paths.yaml", "w") as f:
        f.write(_extra_paths_yaml())
    subprocess.Popen(
        "comfy launch -- --listen 0.0.0.0 --port 8000 --extra-model-paths-config /root/extra_model_paths.yaml",
        shell=True,
    )
