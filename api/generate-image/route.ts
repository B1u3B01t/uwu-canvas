import { generateImage, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { isGeminiImageModel } from '../../lib/modelCapabilities';

type ImageProvider = 'openai' | 'google';

function getDedicatedImageModel(provider: ImageProvider, modelId: string) {
  switch (provider) {
    case 'openai':
      return openai.image(modelId);
    case 'google':
      return google.image(modelId);
    default:
      throw new Error(`Provider ${provider} does not support image generation`);
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, provider, model, n = 1, size } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Path B: Gemini image models (Nano Banana) → generateText() + result.files
    // These are multimodal LLMs that can output images, not dedicated image generators
    if (provider === 'google' && isGeminiImageModel(model)) {
      const result = await generateText({
        model: google(model),
        prompt,
      });

      const images = result.files
        .filter((f) => f.mediaType.startsWith('image/'))
        .map((f) => ({
          base64: f.base64,
          mimeType: f.mediaType,
        }));

      if (images.length === 0) {
        // Model returned text instead of an image — pass it back as a fallback
        return Response.json({
          images: [],
          textFallback: result.text || 'The model did not generate an image for this prompt.',
        });
      }

      return Response.json({ images });
    }

    // Path A: Dedicated image models (DALL-E, Imagen) → generateImage()
    const imageModel = getDedicatedImageModel(provider as ImageProvider, model);

    const result = await generateImage({
      model: imageModel,
      prompt,
      n,
      ...(size ? { size } : {}),
    });

    const images = result.images.map((img) => ({
      base64: img.base64,
      mimeType: img.mediaType || 'image/png',
    }));

    return Response.json({ images });
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
