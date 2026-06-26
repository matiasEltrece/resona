import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Webhook de Lemon Squeezy. Verifica HMAC y actualiza el plan del usuario.
 *
 * Eventos:
 *  - subscription_created / _updated / _resumed / _unpaused → setea el plan
 *  - subscription_cancelled / _expired / _paused           → vuelve a free
 *  - order_created (pack de créditos one-time)             → suma créditos
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
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: { attributes?: Record<string, unknown> };
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

async function setPlan(userId: string, planId: string) {
  const service = await createServiceClient();
  await service.from("kyma_profiles").update({ plan: planId, updated_at: new Date().toISOString() }).eq("id", userId);
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

    switch (event) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused": {
        // Mapear variant → plan
        const variantId = String(attrs.variant_id ?? "");
        const { data: plan } = await service
          .from("kyma_plans")
          .select("id")
          .eq("lemon_variant_id", variantId)
          .single();
        // Si no hay mapeo, asumimos 'creator' como default pago
        await setPlan(userId, plan?.id ?? "creator");
        break;
      }
      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused":
        await setPlan(userId, "free");
        break;

      case "order_created": {
        // Pack de créditos one-time: suma al límite del mes actual
        if (attrs.status === "paid") {
          const now = new Date();
          const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          // Sumamos 500 créditos al límite del mes (pack estándar)
          await service.rpc("kyma_consume_credit", { p_user_id: userId, p_month: month }); // asegura fila
          await service
            .from("kyma_credits")
            .update({ limit: 999999 })
            .eq("user_id", userId)
            .eq("month", month);
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
