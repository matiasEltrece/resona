# Investigación — Generación de video online (Remotion y alternativas)

> Junio 2026. Para el feature futuro de Kyma: generar videos automáticos combinando el audio IA + visuales (subtítulos animados, waveforms, etc.).

## Resumen ejecutivo

- **NO se puede renderizar Remotion dentro de Vercel** (Chromium + FFmpeg superan el límite de tamaño/timeout de las serverless functions).
- El patrón correcto: **Vercel (Next.js) orquesta → Remotion Lambda (en NUESTRA cuenta AWS) renderiza → S3/R2 guarda el MP4**.
- ⚠️ **Licencia de Remotion:** nuestro caso (app que genera videos automáticamente) cae en el plan **Automators de pago** (mínimo **$100/mes**) en cuanto el equipo pase de 3 personas. Hay que presupuestarlo.

---

## 1. ¿Se puede online? Sí, con Remotion Lambda

- Corre en **AWS Lambda dentro de tu propia cuenta** (Remotion no hostea). Parte el video en chunks y los renderiza en paralelo.
- **Costo AWS:** centavos por minuto de video. Ej: 1 min HD ≈ **$0.017**, 10 min ≈ **$0.10**. (4K encarece bastante.)
- A eso se suma: egress/storage de S3, CloudWatch logs, y la **licencia Remotion**.

## 2. Por qué NO en Vercel
- Límite de ~50 MB por función; solo Chromium ya casi lo llena (stack completo ~150 MB+).
- Timeouts insuficientes para render de video.
- **Solución oficial de Remotion:** usar Vercel como orquestador que invoca Lambda. Es su patrón recomendado para apps.

## 3. Licencia Remotion (CRÍTICO para el modelo de negocio)
| Plan | Precio | Para qué |
|---|---|---|
| Free | $0 | individuos y empresas **≤3 personas** |
| Creators | $25/mes por seat | producción manual baja escala |
| **Automators** | **$0.01/render, mínimo $100/mes** | **apps que generan video automático ← Kyma** |
| Enterprise | desde $500/mes | términos custom |

En cuanto Kyma sea una empresa de >3 personas y genere videos automáticamente, debemos **mínimo $100/mes** a Remotion, **además** del costo AWS. Es independiente.

## 4. Stack para "captions app" (subtítulos animados tipo TikTok/Submagic)
Remotion tiene módulo dedicado **`@remotion/captions`**. Flujo típico:
```
audio (OmniVoice) → STT con timestamps (Whisper) → @remotion/captions (estilo/animación)
  → Remotion Lambda (render) → S3/R2 (entrega del MP4)
```

## 5. Alternativas (APIs hospedadas, sin gestionar AWS ni licencia Remotion)
| Servicio | Precio | Notas |
|---|---|---|
| **Shotstack** | desde ~$0.20–0.40/min | 1 crédito = 1 min, simple, rápido |
| **Creatomate** | $54/mes (2.000 créditos) | editor de plantillas, modelo computacional |
| **JSON2Video** | bajo costo | opción económica |
| **HyperFrames** | ya integrado en este entorno | alternativa HTML-based, evita la licencia de Remotion |

**Trade-off:** las APIs hospedadas = cero infra y sin licencia tipo Remotion, pero más caras por minuto y menos flexibles (no es React libre). Remotion Lambda = centavos por minuto + control total con React, pero gestionás AWS + licencia.

## 6. Recomendación para Kyma
1. **MVP rápido / evitar AWS + licencia:** empezar con **Shotstack** o **HyperFrames** (ya disponible en el entorno).
2. **Escala con control creativo total:** migrar a **Remotion Lambda** (Vercel orquesta → Lambda → R2). Presupuestar la licencia Automators ($100/mes) desde que el equipo crezca.
3. **NO usar `@remotion/cloudrun`** (está en Alpha, sin mantenimiento).

Fuentes: [remotion.dev/lambda](https://www.remotion.dev/lambda) · [cost-example](https://www.remotion.dev/docs/lambda/cost-example) · [remotion.pro/license](https://www.remotion.pro/license) · [shotstack.io/pricing](https://shotstack.io/pricing/) · [creatomate.com](https://creatomate.com/developers)
