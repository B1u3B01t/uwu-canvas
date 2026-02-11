import type { ModelCapability } from './types';

// ============================================================
// Model exclusion — filter these out of the dropdown entirely
// ============================================================

const EXCLUDED_MODEL_PATTERNS: RegExp[] = [
  /audio/i,
  /realtime/i,
  /\btts\b/i,
  /search/i,
  /transcribe/i,
  /robotics/i,
  /embedding/i,
  /whisper/i,
  /moderation/i,
  /deep-research/i,
  /computer-use/i,
];

/** Returns true if the model should be excluded from the dropdown entirely */
export function shouldExcludeModel(modelId: string): boolean {
  return EXCLUDED_MODEL_PATTERNS.some((p) => p.test(modelId));
}

// ============================================================
// Dedicated image models — use generateImage() API
// ============================================================

const DEDICATED_IMAGE_MODELS = new Set([
  'dall-e-2',
  'dall-e-3',
  'gpt-image-1',
]);

const DEDICATED_IMAGE_PATTERNS: RegExp[] = [
  /^gpt-image-/,  // gpt-image-1-mini, gpt-image-1.5, etc.
  /^imagen-/,     // Google Imagen variants
];

export function isDedicatedImageModel(modelId: string): boolean {
  if (DEDICATED_IMAGE_MODELS.has(modelId)) return true;
  return DEDICATED_IMAGE_PATTERNS.some((p) => p.test(modelId));
}

// ============================================================
// Gemini image models — use generateText() + result.files
// These are multimodal LLMs that can output images AND text
// ============================================================

const GEMINI_IMAGE_MODELS = new Set([
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-image',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-3-pro-image-preview',
  'nano-banana-pro-preview',
]);

// Fallback pattern: any model ID with "image" or "banana" in it
const GEMINI_IMAGE_PATTERN = /image|banana/i;

export function isGeminiImageModel(modelId: string): boolean {
  if (GEMINI_IMAGE_MODELS.has(modelId)) return true;
  return GEMINI_IMAGE_PATTERN.test(modelId);
}

// ============================================================
// Component-capable models — can generate React/TSX code
// ============================================================

const COMPONENT_CAPABLE_PATTERNS: RegExp[] = [
  // OpenAI
  /^gpt-4/,                  // gpt-4o, gpt-4.1, gpt-4-turbo, etc.
  /^gpt-5/,                  // gpt-5, gpt-5.1, gpt-5.2, etc.
  /^o[134](-|$)/,            // o1, o1-mini, o3, o3-pro, o4-mini

  // Anthropic
  /^claude-(sonnet|opus)-4/,  // claude-sonnet-4-*, claude-opus-4-*, 4.5, 4.6
  /^claude-3-[5-9]-/,         // claude-3-5-sonnet-*, claude-3-7-sonnet-*
  /^claude-3-opus/,           // claude-3-opus-*
  /^claude-(sonnet|opus|haiku)-[4-9]/,  // future Claude 4+ variants

  // Google
  /^gemini-[23]\./,           // gemini-2.0-flash, gemini-2.5-pro, etc.
  /^gemini-3/,                // gemini-3-pro-preview, gemini-3-flash-preview
];

function isComponentCapable(modelId: string): boolean {
  return COMPONENT_CAPABLE_PATTERNS.some((p) => p.test(modelId));
}

// ============================================================
// Main capability resolver
// ============================================================

export function getModelCapabilities(modelId: string): ModelCapability[] {
  // Priority 1: Dedicated image-only models
  if (isDedicatedImageModel(modelId)) return ['image'];

  // Priority 2: Gemini multimodal image models (text + image)
  if (isGeminiImageModel(modelId)) return ['text', 'image'];

  // Priority 3: Text models, optionally with component capability
  const caps: ModelCapability[] = ['text'];
  if (isComponentCapable(modelId)) caps.push('component');
  return caps;
}
