import { createClient, createServiceClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import DashboardClient from "./DashboardClient";

const CREATOR_URL = process.env.NEXT_PUBLIC_LEMON_CREATOR_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/2be79926-5aa3-4738-a169-558105a8c7ea";
const PRO_URL = process.env.NEXT_PUBLIC_LEMON_PRO_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/d3e10379-5257-4f13-b560-f0286c4b8be1";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = await createServiceClient();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Datos en paralelo
  const [creditsRes, profileRes, gensRes, packsRes, purchasesRes] = await Promise.all([
    service.from("kyma_credits").select("used, limit").eq("user_id", user.id).eq("month", monthKey).single(),
    service.from("kyma_profiles").select("plan, extra_credits, lemon_customer_portal_url").eq("id", user.id).single(),
    service.from("kyma_generations").select("mode, language, text_length, duration_ms, created_at, provider")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
    service.from("kyma_credit_packs").select("id, name, chars, price_usd, buy_url").eq("active", true).order("sort"),
    service.from("kyma_credit_purchases").select("pack_id, chars, amount_usd, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const used = creditsRes.data?.used ?? 0;
  const limit = creditsRes.data?.limit ?? brand.free.charactersPerMonth;
  const plan = profileRes.data?.plan ?? "free";
  const extraCredits = profileRes.data?.extra_credits ?? 0;
  const portalUrl = profileRes.data?.lemon_customer_portal_url ?? null;
  const generations = gensRes.data ?? [];
  const packs = packsRes.data ?? [];
  const purchases = purchasesRes.data ?? [];
  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;

  return (
    <DashboardClient
      user={{ email: user.email!, id: user.id }}
      credits={{ used, limit, month: monthKey }}
      plan={plan}
      extraCredits={extraCredits}
      portalUrl={portalUrl}
      generations={generations}
      packs={packs}
      purchases={purchases}
      upgradeUrls={{ creator: CREATOR_URL, pro: PRO_URL }}
      isAdmin={isAdmin}
    />
  );
}
