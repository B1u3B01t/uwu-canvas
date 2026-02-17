import { NextResponse } from 'next/server';
import type { ModelCapability } from '../../lib/types';
import {
  shouldExcludeModel,
  isDedicatedImageModel,
  getModelCapabilities,
} from '../../lib/modelCapabilities';

// Types for provider data
export interface ModelInfo {
  id: string;
  name: string;
  capabilities: ModelCapability[];
}

export interface ProviderData {
  name: string;
  models: ModelInfo[];
}

export type ProvidersResponse = Record<string, ProviderData>;

// Fetch OpenAI models
async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    // Filter for chat models (gpt-*, o-series) and image models (dall-e-*, gpt-image-*)
    return data.data
      .filter((m: { id: string }) => {
        if (shouldExcludeModel(m.id)) return false;
        return (
          (m.id.startsWith('gpt-') && !m.id.includes('instruct')) ||
          m.id.startsWith('dall-e-') ||
          m.id.startsWith('o1') ||
          m.id.startsWith('o3') ||
          m.id.startsWith('o4') ||
          isDedicatedImageModel(m.id)
        );
      })
      .map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
        capabilities: getModelCapabilities(m.id),
      }))
      .sort((a: ModelInfo, b: ModelInfo) => {
        // Sort image models to a distinct group at the end
        const aIsImage = a.capabilities.includes('image');
        const bIsImage = b.capabilities.includes('image');
        if (aIsImage !== bIsImage) return aIsImage ? 1 : -1;
        return a.id.localeCompare(b.id);
      });
  } catch {
    return [];
  }
}

// Fetch Anthropic models
async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return data.data
      .map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name || m.id,
        capabilities: getModelCapabilities(m.id),
      }));
  } catch {
    return [];
  }
}

// Fetch Google models
async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    // Filter for generateContent capable models, exclude non-generative ones
    return data.models
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) => {
        const modelId = m.name.replace('models/', '');
        if (shouldExcludeModel(modelId)) return false;
        return m.supportedGenerationMethods?.includes('generateContent');
      })
      .map((m: { name: string; displayName?: string }) => {
        const modelId = m.name.replace('models/', '');
        return {
          id: modelId,
          name: m.displayName || modelId,
          capabilities: getModelCapabilities(modelId),
        };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  const availableProviders: ProvidersResponse = {};

  // Fetch models from each configured provider in parallel
  const promises: Promise<void>[] = [];

  if (process.env.OPENAI_API_KEY) {
    promises.push(
      fetchOpenAIModels(process.env.OPENAI_API_KEY).then((models) => {
        if (models.length > 0) {
          availableProviders.openai = { name: 'OpenAI', models };
        }
      })
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    promises.push(
      fetchAnthropicModels(process.env.ANTHROPIC_API_KEY).then((models) => {
        if (models.length > 0) {
          availableProviders.anthropic = { name: 'Anthropic', models };
        }
      })
    );
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    promises.push(
      fetchGoogleModels(process.env.GOOGLE_GENERATIVE_AI_API_KEY).then((models) => {
        if (models.length > 0) {
          availableProviders.google = { name: 'Google', models };
        }
      })
    );
  }

  await Promise.all(promises);
  return NextResponse.json({ providers: availableProviders });
}
