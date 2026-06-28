import ResetForm from "./ResetForm";
import { brand } from "@/lib/brand";
import PremiumAuth from "@/components/PremiumAuth";

export const metadata = { title: `Nueva contraseña — ${brand.name}` };

export default function ResetPage() {
  return (
    <PremiumAuth title="Nueva contraseña" subtitle="Elegí una contraseña nueva para tu cuenta.">
      <ResetForm />
    </PremiumAuth>
  );
}
