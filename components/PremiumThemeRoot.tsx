"use client";

import { useEffect, useState } from "react";

/* Aplica el tema premium (claro/oscuro, persistido) a una sección de la app
   — dashboard, studio — manteniendo sus componentes, vía la capa de compat de globals. */
export default function PremiumThemeRoot({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { if (localStorage.getItem("kyma-theme") === "dark") setDark(true); }, []);
  return (
    <div className="kyma-premium" data-theme={dark ? "dark" : undefined}
      style={{ position: "relative", minHeight: "100vh", isolation: "isolate", background: "var(--c-page)", color: "var(--c-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, background: "var(--c-page)", zIndex: -1 }} aria-hidden />
      {children}
    </div>
  );
}
