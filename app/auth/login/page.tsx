import LoginForm from "./LoginForm";
import { brand } from "@/lib/brand";
import PremiumAuth from "@/components/PremiumAuth";

export const metadata = { title: `Ingresar — ${brand.name}` };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  return (
    <PremiumAuth title={`Tu cuenta de ${brand.name}`} subtitle="Email y contraseña. 10.000 caracteres gratis al mes.">
      <LoginForm searchParams={searchParams} />
    </PremiumAuth>
  );
}
