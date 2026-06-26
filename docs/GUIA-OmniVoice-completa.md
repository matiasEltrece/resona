# Guía completa de OmniVoice — todos los parámetros, prompting y emociones

> Referencia canónica de TODO lo que el motor de Kyma (OmniVoice) puede hacer.
> Nada queda afuera. Basado en el código fuente real del modelo.

---

## Índice
1. [Los 3 modos de generación](#1-los-3-modos-de-generación)
2. [Voice Design — diseñar una voz desde cero](#2-voice-design)
3. [Cómo aplicar EMOCIONES](#3-cómo-aplicar-emociones)
4. [Tags expresivos (efectos no verbales)](#4-tags-expresivos)
5. [Voice Cloning — clonar una voz](#5-voice-cloning)
6. [Parámetros de generación](#6-parámetros-de-generación)
7. [Idiomas (646) y acentos](#7-idiomas-y-acentos)
8. [Recetas de prompts completas](#8-recetas)

---

## 1. Los 3 modos de generación

OmniVoice tiene **tres modos mutuamente excluyentes**. El modo se decide por qué le pasás:

| Modo | Cómo se activa | Qué hace |
|---|---|---|
| **Voice Clone** | `ref_audio` (+ `ref_text` opcional) | Copia el timbre de un audio de referencia |
| **Voice Design** | `instruct` (descripción de la voz) | Inventa una voz según atributos que describís |
| **Auto Voice** | nada de lo anterior | El modelo elige una voz solo |

En Kyma: la pestaña **"Clonar voz"** usa el modo clone; **"Diseñar voz"** usa el modo design.

---

## 2. Voice Design

Diseñás una voz combinando atributos. Internamente se arma un string `instruct` separado por comas. **Regla de oro: máximo un valor por categoría.**

### Categorías y valores EXACTOS

**Género** (obligatorio recomendado):
- `male` · `female`
- (No existe "neutral" en el modelo — si necesitás algo andrógino, jugá con pitch.)

**Edad:**
- `child` (niño/a)
- `teenager` (adolescente)
- `young adult` (joven adulto)
- `middle-aged` (mediana edad)
- `elderly` (mayor)

**Tono (pitch):**
- `very low pitch` · `low pitch` · `moderate pitch` · `high pitch` · `very high pitch`

**Estilo:**
- `whisper` (susurro / ASMR) — es el ÚNICO estilo que el modelo acepta como tal.

**Acento (SOLO si el idioma es inglés):**
- `american accent` · `british accent` · `australian accent` · `canadian accent` · `indian accent` · `korean accent` · `chinese accent` · `japanese accent` · `portuguese accent` · `russian accent`

**Dialecto (SOLO si el idioma es chino):**
- 河南话 (Henan) · 陕西话 (Shaanxi) · 四川话 (Sichuan) · 贵州话 (Guizhou) · 云南话 (Yunnan) · 桂林话 (Guilin) · 济南话 (Jinan) · 石家庄话 (Shijiazhuang) · 甘肃话 (Gansu) · 宁夏话 (Ningxia) · 青岛话 (Qingdao) · 东北话 (Dongbei/Noreste)

### Reglas de combinación
- ✅ `female, young adult, high pitch` → válido
- ✅ `male, whisper, british accent` → válido (inglés)
- ❌ `male, female` → error (dos géneros)
- ❌ `male, 河南话` (con idioma inglés) → error (mezclar acento inglés con dialecto chino)
- ❌ dos pitches a la vez → error

### Ejemplos de `instruct`
```
female, young adult, high pitch         → mujer joven, voz aguda
male, middle-aged, low pitch            → hombre maduro, voz grave (narrador documental)
child, very high pitch                  → voz infantil
elderly, whisper                        → voz mayor susurrada
male, american accent                   → (idioma EN) hombre con acento americano
女, 中年, 高音调                          → (idioma ZH) mujer mediana edad, agudo
```

---

## 3. Cómo aplicar EMOCIONES

⚠️ **Importante:** OmniVoice **NO tiene un parámetro de "emoción" directo** (no existe `emotion=happy`). La emoción se logra con **tres palancas combinadas**:

### Palanca 1 — Tags expresivos en el texto (la más potente)
Insertá tags donde querés la reacción emocional. Ver sección 4.
```
"¡No puedo creerlo! [laughter] Esto es increíble."   → alegría / risa
"Ay… [sigh] otra vez lo mismo."                       → resignación / tristeza
"¿En serio? [surprise-oh] ¡Guau!"                     → sorpresa
```

### Palanca 2 — La redacción del texto
El modelo lee la intención del texto. Signos de exclamación, preguntas, puntos suspensivos y el vocabulario cambian la entonación:
- `"¡¡Lo logramos!!"` suena enérgico.
- `"No sé... quizás."` suena dubitativo.
- Texto formal → entonación neutra; texto coloquial → más expresivo.

### Palanca 3 — Diseño de voz + velocidad
- `whisper` + velocidad lenta (0.7×) → íntimo, calmo, ASMR.
- pitch alto + velocidad rápida (1.3×) → excitado, juvenil.
- pitch bajo + velocidad lenta → serio, solemne, dramático.

### Recetas de emoción
| Emoción buscada | Cómo lograrla |
|---|---|
| **Alegría** | `[laughter]` + texto con "!" + pitch moderate/high + speed 1.1× |
| **Tristeza** | `[sigh]` + texto con "…" + low pitch + speed 0.85× |
| **Sorpresa** | `[surprise-ah]` / `[surprise-oh]` + "¡!" + high pitch |
| **Calma / ASMR** | `whisper` + speed 0.75× + texto suave |
| **Drama / épica** | low/very low pitch + speed 0.9× + frases cortas |
| **Duda** | `[question-en]` + "…" + speed 0.9× |
| **Disgusto** | `[dissatisfaction-hnn]` + texto seco |

---

## 4. Tags expresivos

Son sonidos no verbales que insertás **inline en el texto** entre corchetes. El modelo los tokeniza aparte para que suenen consistentes en cualquier idioma. En Kyma están los botones que los insertan en el cursor.

| Tag | Sonido | Cuándo usarlo |
|---|---|---|
| `[laughter]` | risa | alegría, humor, ironía |
| `[sigh]` | suspiro | cansancio, alivio, tristeza |
| `[surprise-ah]` | «¡ah!» | sorpresa abierta |
| `[surprise-oh]` | «¡oh!» | sorpresa suave |
| `[surprise-wa]` | «¡wa!» | asombro entusiasta |
| `[surprise-yo]` | «¡yo!» | sorpresa coloquial |
| `[question-en]` | «¿eh?» | duda / repregunta |
| `[question-ah]` | «¿ah?» | pregunta sorprendida |
| `[question-oh]` | «¿oh?» | pregunta suave |
| `[question-ei]` | «¿ei?» | pregunta informal |
| `[question-yi]` | «¿yi?» | pregunta aguda |
| `[confirmation-en]` | «ajá» | confirmación / acuerdo |
| `[dissatisfaction-hnn]` | «hmf» | disgusto / fastidio |

**Tip:** no abuses — 1 o 2 tags por frase rinden mejor que muchos juntos. Poné el tag justo donde quieras la reacción:
```
"Pensé que no llegabas [laughter], qué alivio [sigh]."
```

---

## 5. Voice Cloning

Clonás una voz subiendo un audio de referencia. El modelo aprende el timbre y lo reproduce diciendo tu texto, **en cualquier idioma** (podés clonar una voz en español y generar en inglés).

### Mejores prácticas
1. **Audio limpio:** sin música de fondo, sin ruido, sin reverb.
2. **Duración:** 10s mínimo; **+30s mejora notablemente** la calidad.
3. **Una sola persona hablando**, tono natural.
4. **Transcripción (`ref_text`):** opcional. Si la dejás vacía, OmniVoice la transcribe solo con Whisper. Si la ponés, la clonación es un poco más precisa.
5. **Formato:** WAV/MP3/M4A. Mono o estéreo, cualquier sample rate (se normaliza).

### "Mis voces" (en Kyma)
Cuando subís un audio y lo guardás con nombre, se almacena tu voz de referencia. Después la reusás sin volver a subirla — internamente es `create_voice_clone_prompt` (un prompt de clonación reutilizable).

### ⚠️ Uso responsable
Cloná solo voces propias o con **consentimiento explícito**. Clonar la voz de alguien sin permiso puede ser ilegal y va contra los términos.

---

## 6. Parámetros de generación

| Parámetro | Rango | Default | Qué hace |
|---|---|---|---|
| **speed** | 0.5 – 2.0 | 1.0 | Velocidad de habla. >1 más rápido (audio más corto), <1 más lento |
| **duration** | segundos | auto | Fuerza una duración exacta. Sobrescribe `speed` |
| **quality / num_step** | 16 / 24 / 32 | 24 | Pasos de difusión. Más = mejor calidad, más lento. `fast`=16, `balanced`=24, `high`=32 |
| **seed** | entero | aleatorio | Reproducibilidad: misma seed + mismo input = mismo audio |
| **guidance_scale** | 1.0 – 3.0 | 2.0 | Cuánto "obedece" la guía. Más alto = más fiel al prompt, menos natural |
| **t_shift** | 0.05 – 0.5 | 0.1 | Avanzado: shift del schedule de ruido |
| **denoise** | bool | true | Limpia la salida |

### Relación calidad ↔ velocidad
- `fast` (16 pasos): para iterar rápido / previews.
- `balanced` (24): recomendado para la mayoría.
- `high` (32): exportable / producción.

### duration vs speed
- Si querés que el audio dure **exactamente 8 segundos**, usá `duration=8`.
- Si querés que hable **un 20% más rápido**, usá `speed=1.2`.
- Si ponés ambos, gana `duration`.

---

## 7. Idiomas y acentos

- **646 idiomas** soportados (lista canónica en `lib/languages.ts`, generada del modelo).
- El parámetro `language` acepta el **código ISO** (`es`, `en`, `ja`, `yue`…) o el **nombre en inglés** (`Spanish`, `English`).
- Si el idioma no se reconoce, el modelo cae a modo agnóstico (sigue funcionando).
- **Acentos:** solo aplican en inglés (ver sección 2). En otros idiomas el acento sale del propio idioma.
- **Cross-lingual:** podés clonar una voz grabada en un idioma y generar en otro. El timbre se mantiene; el acento se adapta.

### Salida de audio
- **24 kHz, mono, WAV PCM 16-bit.**

---

## 8. Recetas

### Narrador de documental (español)
```
Idioma: Español
Diseño: male, middle-aged, low pitch
Velocidad: 0.95×   ·   Calidad: high
Texto: "Hace cuatro mil millones de años, la Tierra era un mundo en llamas."
```

### Influencer enérgica (inglés con acento americano)
```
Idioma: English
Diseño: female, young adult, high pitch, american accent
Velocidad: 1.15×   ·   Calidad: balanced
Texto: "Okay you guys [laughter] this is literally the best thing ever!"
```

### ASMR / meditación
```
Idioma: Español
Diseño: female, young adult, moderate pitch, whisper
Velocidad: 0.75×   ·   Calidad: high
Texto: "Respirá profundo… [sigh] soltá todo… estás en calma."
```

### Personaje infantil de videojuego
```
Idioma: Español
Diseño: female, child, very high pitch
Velocidad: 1.1×
Texto: "¡Encontré un tesoro! [surprise-wa] ¡Vamos a abrirlo!"
```

### Voz clonada propia, multilingüe
```
Modo: Clonar voz (subí 30s de tu voz limpia)
Idioma: English (aunque grabaste en español)
Texto: "This is my own voice, now speaking English."
```

---

*Esta guía cubre el 100% de las capacidades de OmniVoice expuestas en Kyma. Para la referencia de la API pública (programática), ver `GUIA-API.md`.*
