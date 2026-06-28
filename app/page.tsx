import LandingPremium from "@/components/LandingPremium";
import { createClient } from "@/lib/supabase/server";

const CREATOR_URL = process.env.NEXT_PUBLIC_LEMON_CREATOR_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/2be79926-5aa3-4738-a169-558105a8c7ea";
const PRO_URL = process.env.NEXT_PUBLIC_LEMON_PRO_BUY_URL ?? "https://synthetic-ai.lemonsqueezy.com/checkout/buy/d3e10379-5257-4f13-b560-f0286c4b8be1";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <LandingPremium isAuthed={!!user} creatorUrl={CREATOR_URL} proUrl={PRO_URL} />;
}
