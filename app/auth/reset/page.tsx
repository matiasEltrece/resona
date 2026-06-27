import ResetForm from "./ResetForm";
import { brand } from "@/lib/brand";

export const metadata = { title: `Nueva contraseña — ${brand.name}` };

export default function ResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8 fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kyma-logo.png" alt={brand.name} className="h-10 w-auto mx-auto" />
        </div>
        <div className="glass fade-up" style={{ borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "var(--shadow-card)" }}>
          <h1 className="text-xl font-semibold mb-1">Nueva contraseña</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Elegí una contraseña nueva para tu cuenta.</p>
          <ResetForm />
        </div>
      </div>
    </div>
  );
}
