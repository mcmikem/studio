'use server';

import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from 'genkit/flow';
import { ReadableStream } from 'stream/web';
import '@/ai'; // This registers the flows

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } }
) {
  const { input, stream } = await req.json();

  if (stream) {
    const genkitStream = await runFlow(params.flow, input, { stream: true });
    const webStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of genkitStream) {
            controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          controller.close();
        } catch (err: any) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  const result = await runFlow(params.flow, input);
  return NextResponse.json(result);
}