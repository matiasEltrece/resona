import Studio from "@/components/Studio";
import NavbarAuth from "@/components/NavbarAuth";
import { brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PremiumThemeRoot from "@/components/PremiumThemeRoot";

export const metadata = { title: `Studio — ${brand.name}` };

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/studio");

  return (
    <PremiumThemeRoot>
      <div className="flex flex-col min-h-screen">
        <NavbarAuth />
        <Studio />
      </div>
    </PremiumThemeRoot>
  );
}
