'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import type { KeyResult, WeeklyWorkplan, DailyPlannerAIOutput } from '@/lib/types';
import { dailyPlannerAI } from '@/ai/flows/daily-planner-flow';
import { Loader2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Separator } from '../ui/separator';

const planSchema = z.object({
  primaryMission: z.string().min(10, 'Please describe your main goal for the day.'),
});

type PlanFormData = z.infer<typeof planSchema>;

function PlannerForm({
  profile,
  weeklyPlan,
  keyResults,
  isGeneratingPlan,
  onPlanGenerate,
}: {
  profile: any;
  weeklyPlan: WeeklyWorkplan | null;
  keyResults: KeyResult[] | null;
  isGeneratingPlan: boolean;
  onPlanGenerate: (data: PlanFormData) => void;
}) {

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  return (
    <form onSubmit={handleSubmit(onPlanGenerate)}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="primaryMission" className="text-lg">What is your main focus for today?</Label>
          <Input
            id="primaryMission"
            placeholder="e.g., Finalize the RED Campaign report and meet with new partners."
            {...register('primaryMission')}
          />
          {errors.primaryMission && (
            <p className="text-sm text-destructive">{errors.primaryMission.message}</p>
          )}
        </div>

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>How the AI Coach Works</AlertTitle>
          <AlertDescription>
            The AI will use your focus, your role as {profile.role}, your weekly priorities, and the live organizational Key Results to help you brainstorm a strategic daily plan.
          </AlertDescription>
        </Alert>

        {weeklyPlan && (
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertTitle>Your Priorities This Week</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside">
                {weeklyPlan.keyPriorities.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isGeneratingPlan} size="lg">
          {isGeneratingPlan ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Brainstorm My Daily Plan
        </Button>
      </CardFooter>
    </form>
  );
}


function PlannerCheckinFormComponent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [aiOutput, setAiOutput] = useState<DailyPlannerAIOutput | null>(null);
  const [primaryMission, setPrimaryMission] = useState("");

  // --- Data Fetching ---
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoadingWeeklyPlan, setIsLoadingWeeklyPlan] = useState(true);

  useEffect(() => {
    async function fetchWeeklyPlan() {
      if (!user || !firestore) return;
      setIsLoadingWeeklyPlan(true);
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const weekStartTimestamp = Timestamp.fromDate(start);

      const q = query(
        collection(firestore, 'workplans'),
        where('userId', '==', user.uid),
        where('weekOf', '==', weekStartTimestamp),
        limit(1)
      );
      try {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setWeeklyPlan(snapshot.docs[0].data() as WeeklyWorkplan);
        }
      } catch (e) {
        console.error("Error fetching weekly plan", e);
      } finally {
        setIsLoadingWeeklyPlan(false);
      }
    }
    fetchWeeklyPlan();
  }, [user, firestore]);

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'));
  }, [firestore]);
  const { data: keyResults, isLoading: isLoadingKeyResults } = useCollection<KeyResult>(keyResultsQuery);


  const onPlanGenerate = async (data: PlanFormData) => {
    if (!profile || !keyResults) {
      toast({
        variant: 'destructive',
        title: 'Missing Context',
        description: 'User profile or organizational data is not yet loaded. Please wait a moment and try again.',
      });
      return;
    }

    setIsGeneratingPlan(true);
    setPrimaryMission(data.primaryMission);

    try {
      const output = await dailyPlannerAI({
        userRole: profile.role,
        primaryMission: data.primaryMission,
        weeklyPriorities: weeklyPlan?.keyPriorities || [],
        keyResults: keyResults,
      });
      setAiOutput(output);
      setPlanGenerated(true);
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Planner Failed',
        description: 'The AI could not generate a plan. Please try again.',
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleFinalizeAndCheckin = () => {
    const planData = {
      primaryMission: primaryMission,
      details: aiOutput
    };
    const params = new URLSearchParams();
    params.set('plan', encodeURIComponent(JSON.stringify(planData)));
    params.set('tab', 'check-in');
    router.push(`/forms?${params.toString()}`);
  }

  const isLoading = isLoadingProfile || isLoadingWeeklyPlan || isLoadingKeyResults;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Daily Planner</CardTitle>
        <CardDescription>
          Use your AI coach to brainstorm a strategic plan, then finalize it for your daily check-in.
        </CardDescription>
      </CardHeader>
      
      {isLoading ? (
        <CardContent>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      ) : profile ? (
        <>
          <PlannerForm
            profile={profile}
            weeklyPlan={weeklyPlan}
            keyResults={keyResults}
            isGeneratingPlan={isGeneratingPlan}
            onPlanGenerate={onPlanGenerate}
          />
          
          { (planGenerated && aiOutput) && !isGeneratingPlan && (
              <div className="space-y-6 pt-4">
                <Separator />
                 <CardContent className="space-y-6">
                    <h3 className="font-headline text-xl text-primary">Your AI-Generated Draft Plan</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold">Key Time Blocks</h4>
                            <ul className="list-disc list-inside text-sm">
                                {aiOutput.timeBlocks.map((b, i) => <li key={i}><strong>{b.startTime}-{b.endTime}:</strong> {b.description}</li>)}
                            </ul>
                        </div>
                         <div className="space-y-3 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold">Multi-Win Connections</h4>
                             <ul className="list-disc list-inside text-sm">
                                {aiOutput.multiWinConnections.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                    
                     <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold">Suggested Resources</h4>
                        <p className="text-sm">{aiOutput.materials || 'None suggested.'}</p>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold flex items-center gap-2"><AlertTriangle /> Challenges & Mitigations</h4>
                        <p className="text-sm mt-2">{aiOutput.challenges}</p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold flex items-center gap-2"><Sparkles /> Best Practice Tip</h4>
                        <p className="text-sm italic mt-2">{aiOutput.bestPractice}</p>
                    </div>
                 </CardContent>
                 <CardFooter>
                    <Button size="lg" onClick={handleFinalizeAndCheckin}>
                        Finalize & Proceed to Check-in Form
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
              </div>
          )}
        </>
      ) : (
        <CardContent>
            <p>Could not load user profile.</p>
        </CardContent>
      )}
    </Card>
  );
}

export function PlannerCheckinForm() {
    return (
        <Suspense>
            <PlannerCheckinFormComponent />
        </Suspense>
    )
}

    