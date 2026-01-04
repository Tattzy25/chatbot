import { v0, type ChatDetail } from 'v0-sdk';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = await v0.chats.create({
    system: 'You are an expert coder',
    message: prompt,
    modelConfiguration: {
      modelId: 'v0-1.5-md',
      imageGenerations: true,
      thinking: true,
    },
  }) as ChatDetail;

  return Response.json({
    url: result.webUrl,
  });
}
