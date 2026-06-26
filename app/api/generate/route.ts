import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/inference";
import type { GenerateRequest } from "@/lib/inference";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ error: "Falta el texto" }, { status: 400 });
  }
  if (body.text.length > 5000) {
    return NextResponse.json(
      { error: "El texto supera el límite de 5000 caracteres" },
      { status: 400 },
    );
  }

  const provider = getProvider();
  const startedAt = Date.now();

  try {
    const result = await provider.generate({
      text: body.text,
      language: body.language ?? "es",
      mode: body.mode === "clone" ? "clone" : "design",
      design: body.design,
      referenceAudioBase64: body.referenceAudioBase64,
      seed: body.seed,
    });

    return NextResponse.json({
      ...result,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
