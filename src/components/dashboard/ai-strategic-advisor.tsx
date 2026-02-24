
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity, User, Checkin, Expense, KeyResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingDown, AlertTriangle, Sparkles, BarChart3, Info, TrendingUp } from 'lucide-react';
import { runStrategicAdvisor } from '@/ai/actions';
import { subDays, startOfDay } from 'date-fns';

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
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(true);

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

  React.useEffect(() => {
    const getInsights = async () => {
      if (activities && checkins && expenses && keyResults) {
        setIsLoadingInsights(true);
        try {
          // Serialize data to plain objects before sending to server action
          const plainActivities = JSON.parse(JSON.stringify(activities));
          const plainCheckins = JSON.parse(JSON.stringify(checkins));
          const plainExpenses = JSON.parse(JSON.stringify(expenses));
          const plainKeyResults = JSON.parse(JSON.stringify(keyResults));

          const result = await runStrategicAdvisor({
            activities: plainActivities,
            checkins: plainCheckins,
            expenses: plainExpenses,
            keyResults: plainKeyResults,
          });
          setInsights(result.insights);
        } catch (error) {
          console.error("Failed to get strategic insights:", error);
          setInsights([]); // Set empty to avoid re-triggering
        } finally {
          setIsLoadingInsights(false);
        }
      }
    };

    if (!isLoadingData) {
      getInsights();
    }
  }, [activities, checkins, expenses, keyResults, isLoadingData]);

  const isLoading = isLoadingData || isLoadingInsights;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-omuto-yellow/10 border-md border-omuto-yellow/20 rounded-lg text-omuto-yellow">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="font-heading text-2xl font-bold uppercase text-omuto-navy">AI Strategic <span className="text-omuto-red">Advisor</span></CardTitle>
        </div>
        <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">High-level insights based on real-time data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <p className="text-sm font-bold mt-4 text-omuto-navy/50">Analyzing data streams...</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
