
import { callOpenRouter, chatWithOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { z } from 'zod';
import { ReceiptOCRInputSchema, ReceiptOCROutputSchema, type ReceiptOCRInput, type ReceiptOCROutput } from '@/lib/types';
import { ai } from '@/ai/genkit';

const ReceiptOCRPrompt = ai.definePrompt({
  name: 'receiptOCRPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are a financial auditor assistant for Omuto Foundation, an NGO in Uganda. 
  Your task is to extract expense details from a receipt image.
  Be precise with amounts and descriptions. 
  Categorize items into: Transport, Rent, Office Dev't, Projects, Stationery, Registration, Meetings, Media, Fuel, Printing & Photocopy, Phone, Food, Mobile Money Charges, IGA Expense, Allowances and Stipends, Kibanja, Professional Services, community support, miscellaneous, Withdraw, Raw Materials.`,
  output: {
    schema: ReceiptOCROutputSchema
  }
});

export async function processReceipt(input: ReceiptOCRInput): Promise<ReceiptOCROutput> {
  const systemPrompt = `You are a financial auditor assistant. Extract receipt data into JSON. If multiple items exist, list them. Return valid JSON only matching the schema.`;
  const prompt = `Extract the following from this receipt: Title (short summary), Items (description, category, amount), and Total Amount.`;

  // 1. Try OpenRouter if configured
  if (aiConfig.openRouterApiKey) {
    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: input.imageBase64 ? `data:image/jpeg;base64,${input.imageBase64}` : (input.imageUri || '')
              } 
            }
          ]
        }
      ];
      
      const text = await chatWithOpenRouter(messages, 'google/gemini-2.0-flash-exp:free', 0.1);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return ReceiptOCROutputSchema.parse({
          title: parsed.title || 'Receipt Scan',
          items: parsed.items || [],
          totalAmount: parsed.totalAmount || 0,
          currency: parsed.currency || 'UGX'
        });
      }
    } catch (error) {
      console.error('Receipt OCR OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini (Genkit) if configured
  if (aiConfig.isConfigured) {
    try {
        // Genkit multimodal might need specific handling, but for now we'll use the prompt
        // Note: genkit-google-ai supports multimodal inputs in the content array
        const response = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            system: systemPrompt,
            prompt: [
                { text: prompt },
                { media: { url: input.imageBase64 ? `data:image/jpeg;base64,${input.imageBase64}` : (input.imageUri || ''), contentType: 'image/jpeg' } }
            ],
            output: {
                schema: ReceiptOCROutputSchema
            }
        });

        if (response.output) {
            return response.output;
        }
    } catch (error) {
      console.error('Receipt OCR Gemini failed:', error);
    }
  }

  // 3. Fallback
  return {
    title: 'Extraction Failed',
    items: [],
    totalAmount: 0,
    currency: 'UGX'
  };
}
