/**
 * Curated model list for the Generator dropdown.
 * When "Show all models" is OFF, only these models are shown.
 * Match by exact model id only.
 */

export type AIProviderKey = 'openai' | 'anthropic' | 'google';

/** Exact model IDs only (must match API response id exactly) */
const CURATED_BY_PROVIDER: Record<AIProviderKey, Set<string>> = {
  google: new Set([
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-exp-image-generation',
    'nano-banana-pro-preview',
  ]),
  anthropic: new Set([
    'claude-opus-4-6',   // Opus 4.6
    'claude-sonnet-4-5-20250929', // Sonnet 4.5
    'claude-haiku-4-5-20251001',  // Haiku 4.5
  ]),
  openai: new Set([
    'gpt-5.2',
    'gpt-5-nano',
    'gpt-image-1.5',
    'gpt-image-1-mini',
  ]),
};

export function isCuratedModel(
  provider: string,
  modelId: string
): boolean {
  const set = CURATED_BY_PROVIDER[provider as AIProviderKey];
  return set ? set.has(modelId) : false;
}
