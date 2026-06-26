import type { InferenceProvider } from "./types";
import { MockProvider } from "./mock";
import { ModalProvider } from "./modal";

export * from "./types";

/**
 * Selector de provider. Controlado 100% por env var, sin tocar código:
 *
 *   INFERENCE_PROVIDER=mock   -> placeholder local, sin GPU  (default)
 *   INFERENCE_PROVIDER=modal  -> OmniVoice real en Modal/RunPod
 */
let cached: InferenceProvider | null = null;

export function getProvider(): InferenceProvider {
  if (cached) return cached;
  const which = (process.env.INFERENCE_PROVIDER ?? "mock").toLowerCase();
  cached = which === "modal" ? new ModalProvider() : new MockProvider();
  return cached;
}
