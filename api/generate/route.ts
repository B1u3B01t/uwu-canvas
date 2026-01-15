import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

type Provider = 'openai' | 'anthropic' | 'google';

// Get the AI model based on provider and model ID
function getModel(provider: Provider, modelId: string) {
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId);
    case 'google':
      return google(modelId);
    case 'openai':
    default:
      return openai(modelId);
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, provider = 'openai', model: modelId = 'gpt-4o' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response('Invalid prompt', { status: 400 });
    }

    const model = getModel(provider as Provider, modelId);

    const result = streamText({
      model,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI generation error:', error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
