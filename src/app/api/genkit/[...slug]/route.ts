// src/app/api/genkit/[...slug]/route.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { NextRequest } from 'next/server';
import { defineFlow, runFlow, getFlow } from 'genkit/flow';
import { z } from 'zod';
import { logger } from 'genkit/logging';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.GEMINI_API_KEY) {
    logger.error("WARNING: GEMINI_API_KEY environment variable is not set. AI features will not work.");
}

// Initialize Genkit
genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Dynamically import all flows
import '@/ai/index';

// This is your HTTP handler for the API route.
export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const flowId = params.slug.join('/');
  logger.info(`Received request for flow: ${flowId}`);

  try {
    const flow = getFlow(flowId);
    if (!flow) {
      logger.error(`Flow not found: ${flowId}`);
      return new Response(`Flow not found: ${flowId}`, { status: 404 });
    }

    const input = await req.json();
    logger.info(`Running flow '${flowId}' with input:`, input);

    const result = await runFlow(flow, input);
    
    logger.info(`Flow '${flowId}' completed successfully.`);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error(`Error running flow '${flowId}':`, error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
