# Kyma — Roadmap de costos GPU (Modal) y cuándo escalar al pago

> Investigación: junio 2026. Fuentes: [modal.com/pricing](https://modal.com/pricing), [Modal cold-start docs](https://modal.com/docs/guide/cold-start), [Modal billing](https://modal.com/docs/guide/billing).

## TL;DR

- Hoy estamos en el plan **Starter** de Modal con **$30/mes de crédito gratis**.
- Una generación de voz de 10s cuesta **~$0.001** (una décima de centavo) en GPU A10.
- Con eso, **hasta ~30.000 generaciones/mes son gratis** (entran en los $30 de crédito).
- Recién hay que poner tarjeta y pagar de verdad cuando pasamos ese volumen.

---

## Precios de Modal (verificados junio 2026)

### GPUs (facturación por segundo)

| GPU | $/segundo | $/hora | Uso recomendado |
|---|---|---|---|
| T4 | $0.000164 | ~$0.59 | TTS si entra en 16 GB |
| L4 | $0.000222 | ~$0.80 | TTS eficiente |
| **A10 / A10G** | **$0.000306** | **~$1.10** | **← el que usamos (OmniVoice)** |
| L40S | $0.000542 | ~$1.95 | modelos más grandes |
| A100 40GB | $0.000583 | ~$2.10 | avatar / video |
| A100 80GB | $0.000694 | ~$2.50 | avatar / batch grande |
| H100 | $0.001097 | ~$3.95 | real-time pesado |
| H200 | $0.001261 | ~$4.54 | — |
| B200 | $0.001736 | ~$6.25 | — |

### Otros costos
- **CPU:** $0.0000131 / core físico / segundo
- **RAM:** $0.00000222 / GiB / segundo
- **Storage (volúmenes):** $0.09 / GiB / mes — **1 TiB/mes gratis** (cubre los ~20 GB de pesos de OmniVoice de sobra)
- **Egress / bandwidth:** **$0 — Modal no cobra salida de datos**
- **Cold start:** SÍ se factura (incluye cargar los pesos del modelo a GPU). Es el costo a vigilar.

### Planes

| | Starter | Team | Enterprise |
|---|---|---|---|
| Fee fijo | **$0** | $250/mes | custom |
| Crédito gratis | $30/mes | $100/mes | custom |
| GPU concurrency | 10 | 50 | custom |
| Contenedores | 100 | 1000 | custom |
| Retención de logs | 1 día | 30 días | custom |

El **precio por segundo de compute es igual en todos los planes**. Lo que cambia es concurrencia, retención y el fee fijo.

---

## Costo real de Kyma por volumen

Supuesto: ~3s de GPU A10 por generación (inferencia + overhead, contenedor warm).
Costo por generación ≈ **$0.00095** (GPU + CPU + RAM).

| Generaciones/mes | Costo compute | Cubierto por $30 free | Pago neto |
|---|---|---|---|
| 1.000 | ~$0.95 | ✅ sí | **$0** |
| 10.000 | ~$9.50 | ✅ sí | **$0** |
| 30.000 | ~$28 | ✅ al límite | **$0** |
| 50.000 | ~$47 | ❌ no | **~$17/mes** |
| 100.000 | ~$95 | ❌ no | **~$65/mes** |
| 500.000 | ~$475 | ❌ no | **~$445/mes** |

> A 100k generaciones/mes pagás ~$65 de GPU. Si cobrás aunque sea $12/mes a 100 usuarios (plan Creator), son $1.200 de ingreso contra $65 de GPU. El margen es altísimo.

---

## Triggers de escalado — cuándo dar cada paso

### 🟢 Etapa 0 — AHORA (hasta ~30k gen/mes)
- **Plan:** Starter ($0 fijo, $30 free)
- **Acción:** nada. Ya está todo configurado.
- **GPU:** A10, scale-to-zero (se apaga a los 5 min sin uso).

### 🟡 Etapa 1 — Poner tarjeta (al acercarse a 30k gen/mes)
- **Disparador:** el dashboard de Modal muestra que estás consumiendo >$25/mes de crédito.
- **Acción:** agregar método de pago en Modal para desbloquear los $29 restantes y no quedarte sin servicio. Seguís en Starter.
- **Costo:** lo que pase de $30 (ej. ~$17/mes a 50k gen).

### 🟠 Etapa 2 — Optimizar cold starts (cuando la latencia moleste)
- **Disparador:** usuarios se quejan de los ~60s de la primera generación, o el tráfico es constante.
- **Acción:** activar `min_containers=1` (1 GPU siempre caliente) o memory snapshots.
- **Costo del keep-warm:** 1× A10 24/7 = ~$1.10/h × 720h = **~$790/mes**. ⚠️ Caro — solo cuando el volumen lo justifique (>200k gen/mes) o como horario (warm solo en horas pico).
- **Alternativa intermedia:** `scaledown_window` más largo (ej. 20 min) para que no se apague entre requests cercanos. Más barato que keep-warm total.

### 🔴 Etapa 3 — Plan Team (al escalar en serio)
- **Disparador:** necesitás >10 GPUs en paralelo (picos de muchos usuarios simultáneos), o retención de logs de 30 días, o sumás gente al equipo.
- **Acción:** subir a Team ($250/mes fijo + $100 crédito).
- **Vale la pena cuando:** el fee de $250 es chico vs. tus ingresos y necesitás la concurrencia.

### ⚫ Etapa 4 — Multi-provider / negociar (escala grande)
- **Disparador:** >$2.000/mes de GPU.
- **Acción:** comparar con RunPod Serverless (a veces más barato), considerar Enterprise de Modal (descuentos por volumen), o reservar capacidad.

---

## Riesgo principal a vigilar: cold starts

Si el tráfico es esporádico, el contenedor se apaga y **cada generación nueva paga el tiempo de cargar el modelo** (~20 GB → puede ser 30-60s facturados). Eso puede multiplicar el costo por varias veces respecto al ~$0.001 ideal.

**Mitigación por etapas:**
1. Hoy (bajo volumen): aceptamos el cold start, es ocasional.
2. Volumen medio: `scaledown_window` de 15-20 min para agrupar requests.
3. Volumen alto: keep-warm en horas pico únicamente.

---

## Notas a verificar antes de comprometer números grandes
- Una fuente secundaria mencionó posibles multiplicadores (3× para "ejecución garantizada", 1.25–2.5× regional) que **no se confirmaron en la página oficial**. Verificar directo con Modal antes de presupuestar a gran escala.
