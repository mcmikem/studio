'use server';

import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from 'genkit/flow';
import { ReadableStream } from 'stream/web';
import '@/ai'; // This registers the flows

export async function POST(req: NextRequest, { params }: { params: { flow: string } }) {
  const flowId = params.flow;
  const body = await req.json();

  console.log(`[Flow Route] Received request for flow: ${flowId}`);
  console.log(`[Flow Route] Input:`, body);

  try {
    const response: any = await runFlow(flowId as any, body);

    // Handle streaming responses
    if (response instanceof Response && response.body) {
      console.log(`[Flow Route] Streaming response for flow: ${flowId}`);
      // If it's a Response object with a stream, we just return it
      return response;
    }

    // Handle non-streaming JSON responses
    console.log(`[Flow Route] JSON response for flow: ${flowId}`);
    return NextResponse.json(response);

  } catch (err: any) {
    console.error(`[Flow Route] Error running flow ${flowId}:`, err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'An unexpected error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
