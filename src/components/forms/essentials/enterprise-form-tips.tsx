import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

type TipKey = 'sales' | 'production' | 'inventory' | 'procurement' | 'feedback' | 'products';

const tipsByType: Record<TipKey, string[]> = {
  sales: [
    'Use exact product names/SKUs from Products so sales and stock reports match.',
    'If partner list is empty, capture customer name + phone manually and continue.',
    'For variable-price soaps/jelly, update unit price per transaction before submitting.'
  ],
  production: [
    'Log finished goods only (e.g., Dignity Pads, Soaps, Body Wash).',
    'Add all raw materials consumed so real production cost can be tracked.',
    'If material list is empty, create raw/packaging items in Products first.'
  ],
  inventory: [
    'Use physical count values, not expected values from memory.',
    'Add notes whenever there is a mismatch for audit trail quality.',
    'Use stock adjustment for damages/loss and this form for count reconciliation.'
  ],
  procurement: [
    'Record quantity + unit cost on the same day materials are received.',
    'Use supplier names consistently to improve procurement analysis.',
    'Only raw/packaging items should be restocked here.'
  ],
  feedback: [
    'Capture product-specific feedback (Pads, Soap variants, Body Care) for product improvements.',
    'Use ratings + comments to detect quality issues early.',
    'When customer is anonymous, leave name blank but keep feedback detailed.'
  ],
  products: [
    'Create finished products for what you sell; create raw/packaging for what you consume in production.',
    'Keep units consistent (piece, bar, bottle, pack, meter, liter, kg).',
    'Set realistic reorder levels to avoid stock-outs during community campaigns.'
  ],
};

export function EnterpriseFormTips({ type }: { type: TipKey }) {
  const tips = tipsByType[type];

  return (
    <Card className="border-lg border-primary/20 bg-primary/5 shadow-comic-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Quick Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-xs sm:text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
