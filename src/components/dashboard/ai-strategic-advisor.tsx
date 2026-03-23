
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity, User, Checkin, Expense, KeyResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingDown, AlertTriangle, Sparkles, BarChart3, Info, TrendingUp, RefreshCw } from 'lucide-react';
import { runStrategicAdvisor } from '@/ai/actions';
import { callAIOfflineFirst, offlineStrategicAdvisor } from '@/lib/offline-ai';
import { subDays, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';

const insightIcons: { [key: string]: React.ElementType } = {
  "📈": TrendingUp,
  "⚠️": AlertTriangle,
  "💡": Lightbulb,
  "📉": TrendingDown,
  "ℹ️": Info,
  default: Sparkles,
};

export function AiStrategicAdvisor() {
  const firestore = useFirestore();
  const [insights, setInsights] = React.useState<any[] | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastRunRef = React.useRef<number>(0);
  const isRunningRef = React.useRef<boolean>(false);

  const thirtyDaysAgo = React.useMemo(() => subDays(new Date(), 30), []);

  const activitiesQuery = useMemoFirebase((db) => db ? query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const { data: activities, isLoading: isActLoading } = useCollection<Activity>(activitiesQuery);

  const checkinsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))) : null, []);
  const { data: checkins, isLoading: isCinLoading } = useCollection<Checkin>(checkinsQuery);

  const expensesQuery = useMemoFirebase((db) => db ? query(collection(db, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const { data: expenses, isLoading: isExpLoading } = useCollection<Expense>(expensesQuery);

  const keyResultsQuery = useMemoFirebase((db) => db ? query(collection(db, 'key-results'), orderBy('priority')) : null, []);
  const { data: keyResults, isLoading: isKrLoading } = useCollection<KeyResult>(keyResultsQuery);

  const isLoadingData = isActLoading || isCinLoading || isExpLoading || isKrLoading;

  const getInsights = React.useCallback(async () => {
    if (!activities || !checkins || !expenses || !keyResults) return;
    
    // Prevent multiple simultaneous runs
    if (isRunningRef.current) return;
    
    // Rate limit: minimum 30 seconds between runs
    const now = Date.now();
    if (now - lastRunRef.current < 30000) {
      console.log('[StrategicAdvisor] Rate limited, skipping...');
      return;
    }
    
    // Only run if we have meaningful data
    const hasData = activities.length > 0 || checkins.length > 0 || expenses.length > 0 || keyResults.length > 0;
    if (!hasData) {
      console.log('[StrategicAdvisor] No data to analyze');
      setInsights([]);
      return;
    }

    isRunningRef.current = true;
    lastRunRef.current = now;
    setError(null);
    setIsLoadingInsights(true);

    try {
      console.log('[StrategicAdvisor] Running analysis...', { 
        activities: activities.length, 
        checkins: checkins.length, 
        expenses: expenses.length, 
        keyResults: keyResults.length 
      });
      
      const plainInput = {
        activities: JSON.parse(JSON.stringify(activities)),
        checkins: JSON.parse(JSON.stringify(checkins)),
        expenses: JSON.parse(JSON.stringify(expenses)),
        keyResults: JSON.parse(JSON.stringify(keyResults)),
      };
      
      const result = await callAIOfflineFirst(
        () => runStrategicAdvisor(plainInput),
        () => offlineStrategicAdvisor(plainInput)
      );
      
      if (result && result.insights) {
        setInsights(result.insights);
        console.log('[StrategicAdvisor] Success:', result.insights.length, 'insights');
      } else {
        setInsights([]);
      }
    } catch (err: any) {
      console.error('[StrategicAdvisor] Error:', err);
      setError(err?.message || 'Failed to get insights');
      setInsights([]);
    } finally {
      setIsLoadingInsights(false);
      isRunningRef.current = false;
    }
  }, [activities, checkins, expenses, keyResults]);

  // Only run once on mount when data is ready
  React.useEffect(() => {
    if (!isLoadingData && activities) {
      getInsights();
    }
  }, [isLoadingData]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = isLoadingData || isLoadingInsights;

  return (
    <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm bg-white overflow-hidden">
      <CardHeader className="bg-omuto-cream/50 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-omuto-yellow/10 border-md border-omuto-yellow/20 rounded-lg text-omuto-yellow">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold uppercase text-omuto-navy">AI Strategic <span className="text-omuto-red">Advisor</span></CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={getInsights}
            disabled={isLoadingInsights}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingInsights ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">High-level insights based on real-time data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        )}
        {!isLoading && insights && insights.length > 0 ? (
          insights.map((insight, index) => {
            const Icon = insightIcons[insight.emoji] || insightIcons.default;
            return (
              <div key={index} className="p-4 bg-muted/40 border-md border-omuto-navy/10 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg border-md border-omuto-navy/5 shadow-sm">
                    <Icon className="h-5 w-5 text-omuto-red" />
                </div>
                <div>
                  <h4 className="font-bold uppercase text-sm text-omuto-navy leading-tight">{insight.title}</h4>
                  <p className="text-xs text-omuto-navy/70 mt-1 mb-2">{insight.description}</p>
                  <p className="text-xs font-bold text-omuto-red bg-omuto-red/10 px-2 py-1 rounded-md">{insight.recommendation}</p>
                </div>
              </div>
            );
          })
        ) : (
          !isLoading && (
            <div className="text-center py-10">
              <BarChart3 className="h-12 w-12 mx-auto text-omuto-navy/10" />
              <p className="text-sm font-bold mt-4 text-omuto-navy/50">Click refresh to analyze data</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
