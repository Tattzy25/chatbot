import { openai } from '@ai-sdk/openai';
import { replicate } from '@ai-sdk/replicate';
import { generateImage } from 'ai';

interface ImageRequest {
  prompt: string;
  provider?: 'replicate' | 'openai';
  numOutputs?: number;
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      provider = 'replicate',
      numOutputs = 1,
    }: ImageRequest = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let result;

    if (provider === 'replicate') {
      // Use Replicate with the new GPT Image model
      result = await generateImage({
        model: replicate.image('openai/gpt-image-1.5'),
        prompt: prompt,
        n: numOutputs,
      });
    } else if (provider === 'openai') {
      // Use OpenAI with the new GPT Image model - fallback if Replicate fails
      result = await generateImage({
        model: openai.image('gpt-image-1.5-2025-12-16'),
        prompt: prompt,
        n: numOutputs,
      });
    } else {
      return Response.json({ error: 'Invalid provider. Use "replicate" or "openai"' }, { status: 400 });
    }

    // Extract the image data from the result
    const imageData = result.images[0];

    return Response.json({
      base64: imageData.base64,
      uint8Array: imageData.uint8Array,
      mediaType: imageData.mediaType,
      alt: prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
