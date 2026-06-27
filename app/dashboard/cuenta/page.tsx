import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import AccountClient from "./AccountClient";

export const metadata = { title: `Tu cuenta — ${brand.name}` };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
  return <AccountClient email={user.email!} isAdmin={isAdmin} />;
}
