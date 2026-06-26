# Kyma — Guía de instalación y handoff técnico

Esta guía permite levantar Kyma **desde cero en una infraestructura totalmente nueva**. Pensada para una transferencia ordenada: seguí los pasos y la app queda corriendo bajo tu propia cuenta, sin dependencias del dueño anterior.

## Arquitectura (4 piezas)

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│   Vercel    │──▶│   Supabase   │   │    Modal    │   │ Lemon Squeezy│
│ (Next.js)   │   │ auth+db+blob │   │ GPU OmniVoice│  │   pagos      │
└─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘
       │                                     ▲
       └─────── llama al endpoint GPU ───────┘
DNS: tu dominio → Vercel (CNAME)
```

## Stack
- **Next.js 16** (App Router, React 19, Tailwind v4)
- **Supabase**: auth (magic link), Postgres, Storage
- **Modal**: GPU serverless corriendo OmniVoice (Apache-2.0)
- **Lemon Squeezy**: cobros (opcional hasta monetizar)
- **Vercel**: hosting · **Cloudflare/DNS**: dominio

## Pasos

### 1. Código
```bash
git clone <repo>
cd resona       # (nombre histórico del repo; la marca es Kyma, ver lib/brand.ts)
pnpm install
cp .env.example .env.local   # completar valores
```

### 2. Supabase
1. Crear proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → pegar y correr `supabase/migrations/001_kyma_complete_schema.sql`.
3. Authentication → Providers → Email → activar **magic link**.
4. Authentication → URL Configuration → agregar `https://TU-DOMINIO/auth/callback` como Redirect URL.
5. Copiar a `.env.local`: Project URL, anon key, service_role key.

### 3. GPU (Modal)
```bash
pip install modal
modal token set --token-id <id> --token-secret <secret>   # cuenta propia
modal deploy gpu/modal_app.py
```
Copiar la URL del endpoint a `OMNIVOICE_ENDPOINT` y poner `INFERENCE_PROVIDER=modal`.
> El primer deploy descarga ~20 GB de pesos (se cachean en un Modal Volume).

### 4. Marca (rebrand en 1 archivo)
Editar `lib/brand.ts` — nombre, dominio, colores, tagline, redes. **Todo el branding sale de ahí.** Cambiá esos valores y la app entera se re-marca.

### 5. Deploy (Vercel)
1. Importar el repo en [vercel.com](https://vercel.com).
2. Cargar todas las env vars de `.env.local` en el proyecto.
3. Apuntar el dominio (DNS CNAME → `cname.vercel-dns.com`, sin proxy).
4. Deploy.

### 6. Pagos (opcional)
Ver `docs/DECISION-modelo-de-pago.md`. Crear productos en Lemon Squeezy, cargar variant IDs en `kyma_plans`, registrar el webhook → `/api/webhooks/lemonsqueezy`.

## Verificación post-instalación
- [ ] Home carga, el Studio genera audio (mock o modal)
- [ ] Registro con magic link → llega el email → entra al dashboard
- [ ] Generación real consume un crédito (dashboard lo refleja)
- [ ] API: crear una key en `/dashboard/api` y probar `POST /api/v1/generate`
- [ ] (si aplica) Compra de prueba en Lemon → webhook actualiza el plan

## Documentación relacionada
- `GUIA-OmniVoice-completa.md` — todos los parámetros del motor
- `GUIA-API.md` — API pública
- `DECISION-modelo-de-pago.md` — planes/pagos
- `ROADMAP-costos-modal.md` — costos GPU y escalado
- `RESEARCH-*.md` — features futuros (video, avatar)

## Costos de operación (referencia)
- **Modal**: ~$0.001 por generación · gratis hasta ~30k/mes ($30 free tier)
- **Supabase**: gratis hasta cierto volumen, luego ~$25/mes Pro
- **Vercel**: gratis (Hobby) / $20/mes (Pro)
- **Lemon Squeezy**: 5% + comisión por transacción (sin fijo)
