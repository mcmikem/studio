import { NextRequest, NextResponse } from "next/server";
import { runFlow } from "@genkit-ai/next";
import "@/ai/dev"; // This registers the flows
import { ReadableStream } from "stream/web";

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } }
) {
  const { input } = await req.json();

  try {
    const { stream, response } = runFlow(params.flow, input);

    // Return the stream directly to the client
    return new NextResponse(stream as ReadableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error(`Error running flow ${params.flow}:`, error);
    return new NextResponse(
      JSON.stringify({
        error: `Failed to run flow: ${error.message || "Unknown error"}`,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
