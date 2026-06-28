import { NextResponse } from "next/server";
import { brand } from "@/lib/brand";

export const runtime = "nodejs";

/** GET /api/openapi — spec OpenAPI 3 de la API pública de Kyma (alimenta Swagger UI en /docs/api). */
const spec = {
  openapi: "3.0.3",
  info: {
    title: "Kyma API",
    version: "1.0.0",
    description:
      "API de generación de voz con IA — TTS, voice design y clonación, 646 idiomas.\n\n" +
      "**Autenticación:** generá una API key en tu dashboard (plan Pro) y mandala como " +
      "`Authorization: Bearer kyma_sk_...` o en el header `x-api-key`.",
  },
  servers: [{ url: `https://${brand.domain}`, description: "Producción" }],
  components: {
    securitySchemes: {
      BearerKey: { type: "http", scheme: "bearer", bearerFormat: "kyma_sk_...", description: "Authorization: Bearer kyma_sk_..." },
      ApiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
    },
    schemas: {
      Design: {
        type: "object",
        description: "Parámetros para diseñar la voz (mode=design).",
        properties: {
          gender: { type: "string", enum: ["female", "male"] },
          age: { type: "string", enum: ["child", "teenager", "young_adult", "middle_aged", "elderly"] },
          pitch: { type: "string", enum: ["very_low", "low", "moderate", "high", "very_high"] },
          whisper: { type: "boolean", description: "Estilo susurrado / ASMR." },
          accent: { type: "string", description: 'Solo inglés: "american", "british", "australian", "indian"…' },
          dialect: { type: "string", description: 'Solo chino: "四川话", "东北话"…' },
        },
      },
      GenerateRequest: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", maxLength: 5000, example: "Hola, esto es Kyma por API. [laughter]", description: "Texto a generar. Soporta tags como [laughter]." },
          language: { type: "string", default: "es", example: "es", description: 'Código ISO o nombre del idioma (646 soportados).' },
          mode: { type: "string", enum: ["design", "clone"], default: "design" },
          design: { $ref: "#/components/schemas/Design" },
          referenceAudioBase64: { type: "string", description: "Audio de referencia en base64 (WAV/MP3) para mode=clone." },
          referenceText: { type: "string", description: "Transcripción del audio de referencia (opcional)." },
          savedVoiceId: { type: "string", description: "ID de una voz guardada tuya (alternativa a referenceAudioBase64)." },
          consent: { type: "boolean", description: "Obligatorio en clonación: confirma que tenés permiso para usar la voz." },
          speed: { type: "number", minimum: 0.5, maximum: 2.0, default: 1.0 },
          durationSec: { type: "number", nullable: true },
          quality: { type: "string", enum: ["fast", "balanced", "high"], default: "balanced" },
          seed: { type: "integer", description: "Semilla opcional para reproducibilidad." },
        },
      },
      GenerateResponse: {
        type: "object",
        properties: {
          audioBase64: { type: "string", description: "WAV 24 kHz mono en base64." },
          mime: { type: "string", example: "audio/wav" },
          durationMs: { type: "integer", example: 3200 },
          rtf: { type: "number", example: 0.025, description: "Real-time factor." },
          provider: { type: "string", example: "modal" },
          latencyMs: { type: "integer", example: 1840 },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string", example: "invalid_key" },
        },
      },
    },
  },
  security: [{ BearerKey: [] }, { ApiKeyHeader: [] }],
  paths: {
    "/api/v1/generate": {
      post: {
        summary: "Generar voz (TTS / design / clone)",
        tags: ["Generación"],
        description:
          "Genera audio a partir de texto. Exclusivo del plan **Pro**. Se mide por caracteres del pool mensual de tu cuenta. Rate limit: 30 req/min por key.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/GenerateRequest" } } },
        },
        responses: {
          200: { description: "Audio generado", content: { "application/json": { schema: { $ref: "#/components/schemas/GenerateResponse" } } } },
          400: { description: "Request inválida (sin texto, JSON malo, falta consent, texto > 5000)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Falta la API key o es inválida/revocada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "El plan no es Pro", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          429: { description: "Rate limit (30/min) o créditos mensuales agotados", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Error de generación", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
} as const;

export function GET() {
  return NextResponse.json(spec, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" },
  });
}
