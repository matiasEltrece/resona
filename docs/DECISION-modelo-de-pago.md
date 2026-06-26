# Decisión: modelo de pago — planes vs pago por uso

> Recomendación para Kyma, basada en cómo lo hace Synthetic (Lemon Squeezy) y la realidad técnica del producto.

## Recomendación corta

**Híbrido, pero arrancando con SUSCRIPCIÓN + créditos.**
1. **Planes mensuales** (Free / Creator / Pro) → para usuarios de la web. Predecible, ya implementado.
2. **Packs de créditos one-time** → para quien necesita más en un mes puntual o usa mucho la API.
3. **Pay-per-use puro** (facturar cada generación) → **NO al principio.** Lemon Squeezy no tiene billing por uso nativo y agrega complejidad. Se evalúa recién a escala enterprise.

## Por qué

| Modelo | Pro | Contra | ¿Para Kyma? |
|---|---|---|---|
| **Suscripción** (planes) | Ingreso recurrente predecible, fácil en Lemon, ya está | Usuarios ocasionales no convierten | ✅ **Base** |
| **Packs de créditos** (one-time) | Captura al usuario que no quiere suscribirse, monetiza picos | No es recurrente | ✅ **Complemento** |
| **Pay-per-use** (metered) | Justo, escala con el valor | Lemon no lo soporta nativo; necesitás medición + facturación propia; fricción de "taxímetro" | ⏳ **Más adelante** |

El costo real por generación es **~$0.001** (ver ROADMAP-costos-modal.md). Con eso, cualquier plan de suscripción tiene **margen enorme**:
- Creator $12/mes con 500 generaciones → costo GPU ~$0.50 → **96% de margen**.
- Pro $39/mes ilimitado → aunque genere 10.000 → costo ~$9.50 → **75% de margen**.

## Planes propuestos (ya en la DB, tabla `kyma_plans`)

| Plan | Precio | Generaciones/mes | API | Extra |
|---|---|---|---|---|
| **Free** | $0 | 20 | ❌ | con marca de agua / demo |
| **Creator** | $12/mes | 500 | ✅ | voice cloning, "Mis voces", HD sin marca |
| **Pro** | $39/mes | ilimitado* | ✅ | API alto volumen, prioridad, soporte |
| **Pack créditos** | $X one-time | +500 al mes actual | — | para overflow puntual |

\* "ilimitado" con fair-use (límite técnico alto para evitar abuso).

## Cómo conectarlo (pasos concretos)

Ya está construido el backend. Falta la parte de Lemon Squeezy (cuenta del usuario):

1. **En Lemon Squeezy** (dashboard de la tienda):
   - Crear los productos/variantes: Creator mensual, Pro mensual, (opcional anual), Pack de créditos.
   - Copiar los **variant IDs** de cada uno.
2. **En Supabase** (`kyma_plans`): cargar el `lemon_variant_id` de cada plan:
   ```sql
   update kyma_plans set lemon_variant_id = '<variant_id>' where id = 'creator';
   update kyma_plans set lemon_variant_id = '<variant_id>' where id = 'pro';
   ```
3. **En Vercel** (env vars — las keys ya están en ~/.synthetic-tokens.env):
   - `LEMON_API_KEY`, `LEMON_STORE_ID`, `LEMON_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_LEMON_CREATOR_BUY_URL`, `NEXT_PUBLIC_LEMON_PRO_BUY_URL` (URLs de checkout hosted)
4. **En Lemon Squeezy → Webhooks**: apuntar a `https://kyma.synthetic.com.ar/api/webhooks/lemonsqueezy` con el mismo `LEMON_WEBHOOK_SECRET`. El webhook ya está implementado y verifica la firma HMAC.
5. El botón de compra (`BuyButton`) abre el checkout hosted de Lemon con `checkout[custom][user_id]=<uuid>` para que el webhook mapee la compra al usuario.

## Flujo (igual que Synthetic, adaptado)
```
Usuario logueado → click "Suscribirme" → checkout hosted de Lemon
   → paga → Lemon dispara webhook → /api/webhooks/lemonsqueezy
   → verifica HMAC → mapea variant → plan → actualiza kyma_profiles.plan
   → el límite mensual de créditos se ajusta solo (kyma_consume_credit lee el plan)
```

## Lo que falta del lado nuestro (no-código)
- [ ] Crear los productos en Lemon Squeezy y copiar variant IDs
- [ ] Cargar variant IDs en `kyma_plans`
- [ ] Setear las 3 env vars de Lemon + las buy URLs en Vercel
- [ ] Registrar el webhook en Lemon apuntando a nuestra URL

Cuando tengas eso, el cobro queda 100% funcional. El código (webhook, mapeo, planes, créditos) ya está listo y deployado.
