import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSiteConfig, FONT_PRESETS } from "@/lib/site-config";
import BrandingForm from "@/components/admin/BrandingForm";

export const metadata = { title: "Marca — Kyma admin" };
export const dynamic = "force-dynamic";

export default async function BrandingAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) redirect("/dashboard");

  const config = await getSiteConfig();

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marca <span className="text-xs text-muted font-normal">· admin</span></h1>
          <p className="text-muted text-sm mt-1">Colores, tipografía y logos del sitio — se aplican a todo kyma.synthetic.com.ar sin necesidad de redeploy.</p>
        </div>
        <Link href="/dashboard/admin" className="text-sm text-muted hover:text-white">← Centro de control</Link>
      </div>

      <BrandingForm initial={config} fontPresets={FONT_PRESETS} />
    </div>
  );
}
