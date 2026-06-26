# Investigación — Avatar virtual con IA para streaming EN VIVO

> 2026. Research para un feature futuro de Kyma. Foco: avatar en vivo, baja latencia, self-hosteable, que se integre con OmniVoice (nuestro TTS).

## TL;DR

- El `<200ms` total NO es realista para el loop conversacional completo (ASR→LLM→TTS→avatar). Sí lo es para el **segmento audio→video** (lip-sync + WebRTC). Round-trip conversacional real: **~0.7–1.5s**.
- Como **ya tenemos el TTS (OmniVoice)**, nuestro problema es exactamente el segmento audio→video, que sí cae en rango.
- El stack self-hosted ganador: **LiveTalking (Apache-2.0) + MuseTalk (MIT)** sobre **RunPod RTX 4090** (~$0.35–0.70/hr por stream).
- ⚠️ **HeyGen es el PEOR fit**: en real-time es text-first (hace su propio TTS), no te deja usar OmniVoice en vivo.
- **Atajo para validar rápido sin GPU propia: Simli API** (acepta tu audio, <300ms, ~$0.009–0.05/min).

---

## 1. Cómo funciona HeyGen
- Modelo offline (Avatar IV): "diffusion audio-to-expression engine" desde una sola imagen.
- Lip-sync fonema-por-fonema, frame a frame.
- Real-time: el SDK viejo *Interactive Avatar* **se discontinúa el 31-mar-2026**, migran a **LiveAvatar** (WebRTC/LiveKit, ~$0.03–0.10/min).
- **Limitación clave:** en streaming es text-first (modo REPEAT → HeyGen hace el TTS). Pasar audio propio solo existe en la API batch. **No sirve para mantener OmniVoice en el loop en vivo.**

## 2. Modelos open-source — los candidatos limpios (real-time + licencia comercial)

| Modelo | Real-time | Licencia | Notas |
|---|---|---|---|
| **MuseTalk 1.5** ⭐ | 30fps (V100) · 72fps (4090) | **MIT ✅** | Lip-sync por inpainting latente, edita avatar existente. ~4GB |
| **Ditto** ⭐ | first-frame ~385ms (A100) | **Apache-2.0 ✅** | Talking-head desde 1 imagen, diseñado para streaming, trae TensorRT |
| **LivePortrait** | ~68fps (4090) | MIT ⚠️ (bundlea InsightFace NC — reemplazar) | Reenactment por video, no audio |
| **RAD-NeRF / ER-NeRF** | 40–50fps | **MIT ✅** | NeRF person-specific (entrenás 1 sujeto) |

**Evitar en producto comercial:** Wav2Lip (non-commercial, dataset LRS2), SyncTalk (CC BY-NC), Sonic (CC BY-NC-SA), FLOAT (CC BY-NC-ND), Hallo3 (pesos CogVideoX). Verificar siempre licencia del **código Y de los pesos**.

**Diffusion alta calidad pero LENTOS (offline):** Hallo/Hallo2 (MIT), EchoMimic V1/V2/V3 (Apache ✅), SadTalker (Apache ✅), LatentSync (pesos OpenRAIL++), MEMO (Apache ✅), JoyVASA (MIT ✅).

**Cerrados (no self-host):** OmniHuman (ByteDance, API paga), Loopy, MoCha (Meta).

## 3. Tiempo real — qué permite baja latencia
- **MuseTalk**: inpainting single-step (no diffusion por frame) → 30fps+.
- **Ditto**: Audio2Feat 23ms + Motion DiT 62ms + Render 15ms con TensorRT.
- **NVIDIA Audio2Face-3D**: blendshapes a >60fps (solo animación).
- Clave: **chunkear el audio del TTS** y solapar etapas async. WebRTC agrega 100–300ms.

## 4. El framework que une todo: LiveTalking
`github.com/lipku/LiveTalking` (antes metahuman-stream) — **Apache-2.0**, mantenido (v2.0.4, jun 2026).
- **El único paquete self-hosteable que junta TTS + lip-sync + WebRTC + salida OBS.**
- Modelos: Wav2Lip256, **MuseTalk**, ER-NeRF, Ultralight.
- Salida: WebRTC, RTMP (YouTube/Twitch), **virtual camera** (OBS-ready).
- TTS: EdgeTTS, CosyVoice, etc. → **acá enchufamos OmniVoice** (reemplazás el módulo TTS).
- Features: barge-in, video idle, multi-sesión. FPS: musetalk 45fps (3090) / 72fps (4090).

## 5. APIs comerciales (si self-host es muy complejo)

| Proveedor | Latencia | Precio/min | ¿Acepta nuestro audio? |
|---|---|---|---|
| **Simli** ⭐ | <300ms | $0.009–0.05 | ✅ sí (mejor fit) |
| **Beyond Presence** | sub-1s | ~$0.085 | ✅ Audio-to-Video API |
| **Tavus (Phoenix-4)** | sub-600ms | ~$0.32 | ✅ echo mode / BYO TTS |
| **D-ID Agents** | "Slow" real | ~$0.35 | ✅ subís tu audio |
| **HeyGen LiveAvatar** | "Medium" | $0.03–0.10 | ❌ solo texto |

**Para nosotros (tenemos TTS): Simli es el mejor**, seguido de Beyond Presence y Tavus echo.

## 6. Integración con OBS (ya tenés OBS configurado)
1. **Browser Source (WebRTC/WHEP)** — apuntás a la URL del avatar. Lo más fácil.
2. **Virtual Camera** — LiveTalking la expone nativa (`virtualcam`). Máxima compatibilidad.
3. **WHIP/WHEP nativo** — OBS 30.0+ tiene WHIP; menor latencia.
4. **NDI** — para meter render de Unreal/MetaHuman (3D).

## 7. Costo GPU (1 stream en vivo = 1 GPU pinneada)
- **Sweet spot: RTX 4090 en RunPod** ~$0.34–0.69/hr. Modal no tiene 4090 (su opción real-time más barata: L4 $0.80 / A10 $1.10).
- 100 streams concurrentes ≈ $34–69/hr.
- **RunPod (pods persistentes) es mejor que Modal para live** — sin cold-start, GPU caliente por sesión.

## 8. Recomendación de arquitectura

```
OmniVoice (TTS chunked)
      ▼
LiveTalking (Apache-2.0) + MuseTalk 1.5 (MIT)
      ▼
WebRTC → OBS (Browser Source o Virtual Camera)
      └→ RTMP → YouTube/Twitch
GPU: RunPod RTX 4090 (~$0.35–0.70/hr por stream)
```

**Fases sugeridas:**
1. **Fase 0 (validar sin GPU):** integrar **Simli** o **Beyond Presence** por API (aceptan el audio de OmniVoice). Salís a OBS por Browser Source. Cero infra.
2. **Fase 1 (MVP self-hosted):** LiveTalking + MuseTalk en RunPod 4090, OmniVoice como TTS, WebRTC → OBS Virtual Camera.
3. **Fase 2 (3D foto-realista, opcional):** NVIDIA Audio2Face-3D (open-source desde sep-2025) → MetaHuman → NDI → OBS. Más pesado.

**A verificar antes de comprometerse:** precios RunPod (volátiles), licencias de pesos (Wan/CogVideoX), VRAM real de Ditto/ER-NeRF (no publicada), ms end-to-end de LiveTalking (medir).

---

### Próximo paso posible
Armar un PoC: repo mínimo OmniVoice → LiveTalking/MuseTalk → OBS, o evaluar Simli como atajo de Fase 0.

Fuentes: [LiveTalking](https://github.com/lipku/LiveTalking) · [MuseTalk](https://github.com/TMElyralab/MuseTalk) · [Ditto](https://github.com/antgroup/ditto-talkinghead) · [Simli OBS guide](https://dev.to/simli_ai/how-to-create-real-time-ai-video-avatar-in-7-minutes-2i29) · [NVIDIA Audio2Face](https://developer.nvidia.com/blog/nvidia-open-sources-audio2face-animation-model/)
