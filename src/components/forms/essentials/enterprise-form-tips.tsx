import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getEnterpriseInsightsAction } from '@/actions/mutations';
import { callAIOfflineFirst, offlineEnterpriseAdvisor } from '@/lib/offline-ai';
import { Button } from '@/components/ui/button';

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
  const [staticTips] = useState(tipsByType[type]);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAiTip = async () => {
    setIsLoading(true);
    try {
      const aiInput = { sales: [], inventory: [], production: [] };
      const result = await callAIOfflineFirst(
        () => getEnterpriseInsightsAction(aiInput),
        () => offlineEnterpriseAdvisor(aiInput)
      );
      if (result.insights && result.insights.length > 0) {
        setAiTip(result.insights[0].insight);
      }
    } catch (e) {
      console.error("Failed to fetch AI tip", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-lg border-primary/20 bg-primary/5 shadow-comic-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Pro Tips
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchAiTip} 
          disabled={isLoading}
          className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
          Get AI Tip
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {aiTip && (
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">AI Suggestion</p>
            <p className="text-xs font-bold text-omuto-navy leading-relaxed">{aiTip}</p>
          </div>
        )}
        <ul className="list-disc space-y-1 pl-5 text-xs sm:text-sm text-muted-foreground">
          {staticTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
