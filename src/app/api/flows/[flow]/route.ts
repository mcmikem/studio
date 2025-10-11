import { NextRequest, NextResponse } from "next/server";
import { runFlow } from "@genkit-ai/next";
import "@/ai/dev"; // This registers the flows
import { ReadableStream } from "stream/web";

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } }
) {
  const { input } = await req.json();

  const { stream, response } = runFlow(params.flow, input);

  return new NextResponse(stream as ReadableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
