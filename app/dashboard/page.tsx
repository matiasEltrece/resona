import { createClient, createServiceClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = await createServiceClient();

  // Obtener créditos del mes actual
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: credits } = await service
    .from("kyma_credits")
    .select("used, limit")
    .eq("user_id", user.id)
    .eq("month", monthKey)
    .single();

  const used = credits?.used ?? 0;
  const limit = credits?.limit ?? brand.free.generationsPerMonth;

  return (
    <DashboardClient
      user={{ email: user.email!, id: user.id }}
      credits={{ used, limit, month: monthKey }}
    />
  );
}
