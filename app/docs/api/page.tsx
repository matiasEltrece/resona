"use client";

import { useEffect, useRef, useState } from "react";

/* Referencia interactiva: Swagger UI (self-hosted en /public/vendor/swagger,
   versión fijada 5.17.14) apuntando a /api/openapi, reskineado en dorado por
   las reglas .kyma-premium .swagger-ui de globals.css. */

declare global {
  interface Window {
    SwaggerUIBundle?: { (opts: Record<string, unknown>): void; presets: { apis: unknown } };
  }
}

export default function ApiPlayground() {
  const started = useRef(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/swagger/swagger-ui.css";
    document.head.appendChild(css);

    const init = () => {
      const SUI = window.SwaggerUIBundle;
      if (!SUI) { setState("error"); return; }
      SUI({
        url: "/api/openapi",
        domNode: document.getElementById("swagger"),
        deepLinking: true,
        presets: [SUI.presets.apis],
        layout: "BaseLayout",
        tryItOutEnabled: true,
      });
      setState("ready");
    };

    const script = document.createElement("script");
    script.src = "/vendor/swagger/swagger-ui-bundle.js";
    script.onload = init;
    script.onerror = () => setState("error");
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ width: 22, height: 3, borderRadius: 2, background: "var(--accent-grad)" }} />
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--c-text-3)" }}>Referencia API</span>
        </div>
        <h1 style={{ fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "var(--font-head)" }}>API interactiva</h1>
        <p style={{ marginTop: 12, fontSize: 17, color: "var(--c-text-2)", lineHeight: 1.6 }}>
          Probá los endpoints en vivo. Autorizá con tu API key (botón <strong style={{ color: "var(--c-text)" }}>Authorize</strong>) y ejecutá. El spec crudo está en{" "}
          <a href="/api/openapi" style={{ color: "var(--accent-solid)" }}>/api/openapi</a>.
        </p>
      </header>

      {state === "loading" && <p style={{ color: "var(--c-text-3)", fontSize: 14 }}>Cargando la referencia…</p>}
      {state === "error" && (
        <p style={{ color: "var(--c-text-2)", fontSize: 14 }}>
          No se pudo cargar Swagger UI. Podés ver el spec directo en{" "}
          <a href="/api/openapi" style={{ color: "var(--accent-solid)" }}>/api/openapi</a> o la{" "}
          <a href="/docs/generate" style={{ color: "var(--accent-solid)" }}>referencia escrita</a>.
        </p>
      )}
      <div id="swagger" />
    </>
  );
}
