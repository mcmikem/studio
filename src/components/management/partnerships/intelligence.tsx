
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Loader2, Wand } from 'lucide-react';
import { partnershipAdvisor, type PartnershipAdvisorOutput } from '@/ai/flows/partnership-advisor-flow';
import { useToast } from '@/hooks/use-toast';

export function PartnershipIntelligence() {
  const [recommendations, setRecommendations] = useState<PartnershipAdvisorOutput['recommendations'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getAdvice = async () => {
    setIsLoading(true);
    try {
      const result = await partnershipAdvisor({});
      setRecommendations(result.recommendations);
    } catch (e) {
      console.error("Failed to get partnership advice:", e);
      toast({
        variant: 'destructive',
        title: 'AI Advisor Error',
        description: 'Could not generate strategic recommendations at this time.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAdvice();
  }, []); // Run on component mount

  const priorityColors: { [key: string]: string } = {
    High: "bg-red-500/10 text-red-500 border-red-500/20",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand className="h-6 w-6 text-primary" />
          Partnership Intelligence
        </CardTitle>
        <CardDescription>AI-powered strategic recommendations for your pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
        {!isLoading && recommendations && recommendations.length > 0 && (
          recommendations.map((rec, i) => (
            <div key={i} className={`p-3 rounded-lg border ${priorityColors[rec.priority]}`}>
              <p className="font-semibold">{rec.recommendation}</p>
              <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
            </div>
          ))
        )}
         {!isLoading && (!recommendations || recommendations.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                <p>No high-priority recommendations from the AI right now.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
