import { streamText, type ModelMessage, type TextPart, type ImagePart, type FilePart } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

type Provider = 'openai' | 'anthropic' | 'google';

// Message content part from client
interface ClientContentPart {
  type: 'text' | 'image' | 'file';
  text?: string;
  image?: string; // base64
  data?: string; // base64
  mimeType?: string;
}

interface ClientMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ClientContentPart[];
}

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

// Convert client message parts to AI SDK format
function convertToAISDKMessages(clientMessages: ClientMessage[]): ModelMessage[] {
  return clientMessages.map((msg) => {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content,
      } as ModelMessage;
    }

    // Handle multi-part content
    const contentParts: (TextPart | ImagePart | FilePart)[] = msg.content.map((part) => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text! } as TextPart;
      } else if (part.type === 'image') {
        // AI SDK expects base64 data or URL for images
        return {
          type: 'image',
          image: part.image!, // base64 string
          mimeType: part.mimeType,
        } as ImagePart;
      } else if (part.type === 'file') {
        // AI SDK file part for PDFs, documents, etc.
        return {
          type: 'file',
          data: part.data!, // base64 string
          mediaType: part.mimeType!, // AI SDK v6 uses mediaType
        } as FilePart;
      }
      // Fallback
      return { type: 'text', text: '' } as TextPart;
    });

    return {
      role: msg.role,
      content: contentParts,
    } as ModelMessage;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, messages, provider = 'openai', model: modelId = 'gpt-4o' } = body;

    const aiModel = getModel(provider as Provider, modelId);

    // Support both simple prompt and structured messages
    if (messages && Array.isArray(messages)) {
      // New structured messages format with file/image support
      const coreMessages = convertToAISDKMessages(messages);

      const result = streamText({
        model: aiModel,
        messages: coreMessages,
      });

      return result.toTextStreamResponse();
    } else if (prompt && typeof prompt === 'string') {
      // Legacy simple prompt format
      const result = streamText({
        model: aiModel,
        prompt,
      });

      return result.toTextStreamResponse();
    } else {
      return new Response('Invalid request: must provide prompt or messages', { status: 400 });
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
