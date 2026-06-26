# Kyma API — Referencia para desarrolladores

La API pública de Kyma te deja generar voz (text-to-speech, voice cloning y voice design) desde cualquier lenguaje o producto. Misma calidad que el Studio, 646 idiomas, vía un POST.

## Autenticación

Todas las requests necesitan una **API key**. Generala en tu [dashboard → API & claves](https://kyma.synthetic.com.ar/dashboard/api).

Mandala en el header:
```
Authorization: Bearer kyma_sk_xxxxxxxxxxxxxxxx
```
(También se acepta `x-api-key: kyma_sk_...`.)

⚠️ La key se muestra **una sola vez** al crearla. Guardala segura. Si la perdés, revocala y generá otra.

---

## Endpoint

### `POST /api/v1/generate`

Base URL: `https://kyma.synthetic.com.ar`

#### Body (JSON)

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | string | **requerido** | Texto a generar (máx 5000 chars). Soporta tags como `[laughter]`. |
| `language` | string | `"es"` | Código ISO (`es`, `en`, `ja`, `yue`…) o nombre en inglés. 646 idiomas. |
| `mode` | string | `"design"` | `"design"` (diseñar voz) o `"clone"` (clonar). |
| `design` | object | — | Para `mode=design`. Ver abajo. |
| `referenceAudioBase64` | string | — | Para `mode=clone`. Audio de referencia en base64 (WAV/MP3). |
| `referenceText` | string | — | Transcripción del audio de referencia (opcional). |
| `savedVoiceId` | string | — | ID de una voz guardada en "Mis voces" (en vez de subir audio). |
| `speed` | number | `1.0` | 0.5 (lento) – 2.0 (rápido). |
| `durationSec` | number | — | Fuerza una duración exacta en segundos (sobrescribe `speed`). |
| `quality` | string | `"balanced"` | `"fast"` (16 pasos) · `"balanced"` (24) · `"high"` (32). |
| `seed` | number | aleatorio | Para reproducibilidad. |

#### Objeto `design`
| Campo | Valores |
|---|---|
| `gender` | `"female"` · `"male"` |
| `age` | `"child"` · `"teenager"` · `"young_adult"` · `"middle_aged"` · `"elderly"` |
| `pitch` | `"very_low"` · `"low"` · `"moderate"` · `"high"` · `"very_high"` |
| `whisper` | `true` / `false` (estilo ASMR) |
| `accent` | solo inglés: `"american"`, `"british"`, `"australian"`, `"canadian"`, `"indian"`, `"korean"`, `"chinese"`, `"japanese"`, `"portuguese"`, `"russian"` |
| `dialect` | solo chino: `"四川话"`, `"东北话"`, etc. |

#### Respuesta `200`
```json
{
  "audioBase64": "UklGRi4...",
  "mime": "audio/wav",
  "durationMs": 3200,
  "rtf": 0.025,
  "provider": "modal",
  "latencyMs": 1840
}
```
El audio es **WAV 24 kHz mono** en base64. Decodificalo y guardalo/reproducilo.

#### Errores
| Código | `code` | Significado |
|---|---|---|
| 401 | `no_key` / `invalid_key` | Falta la key o es inválida/revocada |
| 400 | `no_text` / `text_too_long` / `bad_json` | Problema con el body |
| 429 | `credits_exhausted` | Llegaste al límite mensual de tu plan |
| 500 | `generation_error` | Error del modelo |

---

## Ejemplos

### cURL — diseñar una voz
```bash
curl -X POST https://kyma.synthetic.com.ar/api/v1/generate \
  -H "Authorization: Bearer kyma_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hola, esto es Kyma por API. [laughter]",
    "language": "es",
    "design": { "gender": "female", "age": "young_adult", "pitch": "high" },
    "speed": 1.1,
    "quality": "balanced"
  }'
```

### Node.js — guardar el WAV
```js
const res = await fetch("https://kyma.synthetic.com.ar/api/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.KYMA_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "This is my cloned voice speaking English.",
    language: "en",
    mode: "design",
    design: { gender: "male", age: "middle_aged", pitch: "low", accent: "british" },
  }),
});
const data = await res.json();
require("fs").writeFileSync("out.wav", Buffer.from(data.audioBase64, "base64"));
```

### Python — voice cloning
```python
import requests, base64

with open("mi_voz.wav", "rb") as f:
    ref = base64.b64encode(f.read()).decode()

r = requests.post(
    "https://kyma.synthetic.com.ar/api/v1/generate",
    headers={"Authorization": "Bearer kyma_sk_xxx"},
    json={
        "text": "Texto generado con mi voz clonada.",
        "language": "es",
        "mode": "clone",
        "referenceAudioBase64": ref,
        "quality": "high",
    },
)
data = r.json()
open("out.wav", "wb").write(base64.b64decode(data["audioBase64"]))
```

---

## Límites y planes

- El uso de la API consume del **mismo pool mensual** que tu cuenta web.
- Free: 20 gen/mes · Creator: 500/mes · Pro: ilimitado.
- Para prompting avanzado, emociones y todos los parámetros: ver [GUIA-OmniVoice-completa.md](GUIA-OmniVoice-completa.md).

## CORS
El endpoint permite CORS (`*`) — podés llamarlo desde el browser. Pero **no expongas tu API key en el frontend** de cara al público; usala desde tu backend.
