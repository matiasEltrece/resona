"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    LemonSqueezy?: { Url: { Open: (url: string) => void } };
    createLemonSqueezy?: () => void;
  }
}

/**
 * Botón de compra que abre el checkout hosted de Lemon Squeezy.
 * - Si el usuario no está logueado, lo manda a login y vuelve a disparar la compra.
 * - Inyecta checkout[custom][user_id] para que el webhook mapee la compra.
 *
 * La URL de compra (buyUrl) sale de una env var por plan; si no está configurada,
 * el botón cae a "Contacto" para no romper la UI antes de conectar Lemon.
 */
export default function BuyButton({
  buyUrl,
  planId,
  className,
  children,
}: {
  buyUrl?: string;
  planId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });
    // Cargar el script del overlay de Lemon
    if (!document.getElementById("lemon-js")) {
      const s = document.createElement("script");
      s.id = "lemon-js";
      s.src = "https://app.lemonsqueezy.com/js/lemon.js";
      s.defer = true;
      s.onload = () => window.createLemonSqueezy?.();
      document.body.appendChild(s);
    }
  }, [supabase]);

  // Si volvemos del login con ?buy=<planId>, auto-disparar
  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("buy") === planId) {
      open();
      // limpiar el query
      params.delete("buy");
      const clean = window.location.pathname + (params.toString() ? `?${params}` : "") + "#precios";
      window.history.replaceState({}, "", clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const open = () => {
    if (!buyUrl) {
      window.location.href = `mailto:?subject=Quiero el plan ${planId}`;
      return;
    }
    if (!userId) {
      // login first, luego volver y comprar
      const next = `${window.location.pathname}?buy=${planId}`;
      window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
      return;
    }
    const u = new URL(buyUrl);
    u.searchParams.set("embed", "1");
    if (email) u.searchParams.set("checkout[email]", email);
    u.searchParams.set("checkout[custom][user_id]", userId);
    const href = u.toString();
    if (window.LemonSqueezy?.Url?.Open) window.LemonSqueezy.Url.Open(href);
    else window.open(href, "_blank");
  };

  return (
    <button onClick={open} className={className}>
      {children}
    </button>
  );
}
