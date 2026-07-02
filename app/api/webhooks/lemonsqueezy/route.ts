import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendKymaEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Webhook de Lemon Squeezy. Verifica HMAC y actualiza el plan del usuario.
 *
 * Eventos:
 *  - subscription_created / _updated / _resumed / _unpaused → setea el plan + estado
 *  - subscription_cancelled  → MANTIENE el plan hasta fin del período (cancel-at-period-end)
 *  - subscription_expired    → el período pagado terminó → recién ahí baja a free
 *  - subscription_paused     → pausa la suscripción → free
 *  - order_created (pack de créditos one-time) → suma créditos
 *
 * Env: LEMON_WEBHOOK_SECRET
 */

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(payload, "utf8").digest("hex"), "utf8");
  const sig = Buffer.from(signature, "utf8");
  if (digest.length !== sig.length) return false;
  return crypto.timingSafeEqual(digest, sig);
}

type LemonPayload = {
  meta?: { event_name?: string; custom_data?: { user_id?: string; pack_id?: string } };
  data?: { id?: string; attributes?: Record<string, unknown> };
};

async function resolveUserId(payload: LemonPayload): Promise<string | null> {
  const fromCustom = payload.meta?.custom_data?.user_id;
  if (fromCustom) return fromCustom;

  // Fallback: por email
  const email = payload.data?.attributes?.user_email as string | undefined;
  if (!email) return null;
  const service = await createServiceClient();
  const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
  return data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function updateProfile(userId: string, fields: Record<string, unknown>) {
  const service = await createServiceClient();
  await service.from("kyma_profiles").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  if (!signature || !verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "";
  const attrs = payload.data?.attributes ?? {};

  try {
    const userId = await resolveUserId(payload);
    if (!userId) return NextResponse.json({ received: true, note: "no user resolved" });

    const service = await createServiceClient();

    const status = String(attrs.status ?? "");
    const renewsAt = (attrs.renews_at as string | null) ?? null;
    const endsAt = (attrs.ends_at as string | null) ?? null;
    const portal = (attrs.urls as { customer_portal?: string } | undefined)?.customer_portal ?? null;

    switch (event) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused": {
        // Mapear variant → plan (si no hay mapeo, asumimos 'creator' como default pago)
        const variantId = String(attrs.variant_id ?? "");
        const { data: plan } = await service
          .from("kyma_plans").select("id").eq("lemon_variant_id", variantId).single();
        await updateProfile(userId, {
          plan: plan?.id ?? "creator",
          subscription_status: status || "active",
          subscription_renews_at: renewsAt,
          subscription_ends_at: endsAt,
          ...(portal ? { lemon_customer_portal_url: portal } : {}),
        });
        // Recibo branded solo al ACTIVAR por primera vez (no en renovaciones/updates)
        if (event === "subscription_created") {
          const email = (attrs.user_email as string | undefined) ?? "";
          if (email) void sendKymaEmail("receipt", email, { kind: "plan", plan: plan?.id ?? "creator" });
        }
        break;
      }
      case "subscription_cancelled":
        // Cancela pero MANTIENE el plan hasta fin del período pagado (cancel-at-period-end).
        // No bajamos a free acá; eso pasa recién en subscription_expired.
        await updateProfile(userId, { subscription_status: "cancelled", subscription_ends_at: endsAt });
        break;
      case "subscription_expired":
        // El período pagado terminó → recién ahora baja a free.
        await updateProfile(userId, { plan: "free", subscription_status: "expired" });
        break;
      case "subscription_paused":
        await updateProfile(userId, { plan: "free", subscription_status: "paused" });
        break;

      case "order_created": {
        // Pack de créditos one-time. Identificamos el pack por custom_data.pack_id.
        const packId = payload.meta?.custom_data?.pack_id;
        const paid = attrs.status === "paid";
        if (paid && packId) {
          const orderId = String(attrs.identifier ?? payload.data?.id ?? "");
          const { data: pack } = await service
            .from("kyma_credit_packs")
            .select("id, chars, price_usd")
            .eq("id", packId)
            .single();
          if (pack) {
            // Idempotencia: no sumar dos veces la misma orden
            const { data: existing } = await service
              .from("kyma_credit_purchases")
              .select("id")
              .eq("lemon_order_id", orderId)
              .maybeSingle();
            if (!existing) {
              await service.rpc("kyma_add_credits", {
                p_user_id: userId,
                p_chars: pack.chars,
                p_pack_id: pack.id,
                p_amount: pack.price_usd,
                p_order_id: orderId,
              });
              const email = (attrs.user_email as string | undefined) ?? "";
              if (email) void sendKymaEmail("receipt", email, { kind: "pack", chars: pack.chars, amount: pack.price_usd });
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    // Devolvemos 200 igual para que Lemon no reintente en loop
    return NextResponse.json({ received: true, error: e instanceof Error ? e.message : "error" });
  }
}
