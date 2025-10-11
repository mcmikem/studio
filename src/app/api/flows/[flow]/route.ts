'use server';

import { runFlow } from 'genkit/flow';
import { NextRequest, NextResponse } from 'next/server';
import '@/ai';
import { ReadableStream } from 'stream/web';

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } }
) {
  const flowId = params.flow;
  const { stream, input } = await req.json();

  if (stream) {
    const { stream, response } = await runFlow(flowId, input, {
      stream: true,
    });
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = JSON.stringify(chunk) + '__NEXT_STREAM_CHUNK_BOUNDARY__\n';
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    });
  }

  const response = await runFlow(flowId, input);
  return NextResponse.json(response);
}
