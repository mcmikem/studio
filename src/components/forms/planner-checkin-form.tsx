'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import type { KeyResult, WeeklyWorkplan, DailyPlannerAIOutput } from '@/lib/types';
import { dailyPlannerAI } from '@/ai/flows/daily-planner-flow';
import { Loader2, Sparkles, AlertTriangle, ArrowRight, PlusCircle, Trash2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startOfWeek } from 'date-fns';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

const planSchema = z.object({
  primaryMission: z.string().min(10, 'Please describe your main focus for the day.'),
});

type PlanFormData = z.infer<typeof planSchema>;

const finalCheckinSchema = z.object({
    primaryMission: z.string(),
    timeBlocks: z.array(z.object({
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().min(1, 'Description cannot be empty.')
    })),
    multiWinConnections: z.array(z.object({ value: z.string().min(1, 'Connection cannot be empty.') })),
    materials: z.string().optional(),
    challenges: z.string().optional(),
    bestPractice: z.string().optional(),
    needsBudget: z.boolean(),
    budgetAmount: z.coerce.number().optional(),
    budgetTitle: z.string().optional(),
}).refine(data => {
    if (data.needsBudget) {
        return !!data.budgetTitle && (data.budgetAmount || 0) > 0;
    }
    return true;
}, {
    message: "If budget is needed, title and amount are required.",
    path: ["budgetTitle"] // You can choose where to show the error
});


function PlannerCheckinFormComponent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiOutput, setAiOutput] = useState<DailyPlannerAIOutput | null>(null);
  
  // --- Data Fetching for Context ---
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
        } else {
            setWeeklyPlan(null);
        }
      } catch (e) {
        console.error("Error fetching weekly plan", e);
      } finally {
        setIsLoadingWeeklyPlan(false);
      }
    }
    if (user && firestore) {
      fetchWeeklyPlan();
    }
  }, [user, firestore]);

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'));
  }, [firestore]);
  const { data: keyResults, isLoading: isLoadingKeyResults } = useCollection<KeyResult>(keyResultsQuery);
  // --- End Data Fetching ---

  const { register: registerMission, handleSubmit: handleMissionSubmit, formState: { errors: missionErrors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors: checkinErrors, isSubmitting } } = useForm({
    resolver: zodResolver(finalCheckinSchema),
    defaultValues: {
        primaryMission: "",
        timeBlocks: [],
        multiWinConnections: [],
        materials: "",
        challenges: "",
        bestPractice: "",
        needsBudget: false,
        budgetAmount: 0,
        budgetTitle: ""
    }
  });

  const { fields: timeBlockFields, append: appendTimeBlock, remove: removeTimeBlock } = useFieldArray({ control, name: "timeBlocks" });
  const { fields: connectionFields, append: appendConnection, remove: removeConnection } = useFieldArray({ control, name: "multiWinConnections" });
  const needsBudget = watch('needsBudget');

  const onPlanGenerate = async (data: PlanFormData) => {
    if (!profile || !keyResults) {
      toast({
        variant: 'destructive',
        title: 'Missing Context',
        description: 'User profile or organizational data is not yet loaded. Please wait and try again.',
      });
      return;
    }

    setIsGeneratingPlan(true);
    setAiOutput(null);

    try {
      const output = await dailyPlannerAI({
        userRole: profile.role,
        primaryMission: data.primaryMission,
        weeklyPriorities: weeklyPlan?.keyPriorities || [],
        keyResults: keyResults,
      });
      setAiOutput(output);
      setValue('primaryMission', data.primaryMission);
      setValue('timeBlocks', output.timeBlocks);
      setValue('multiWinConnections', output.multiWinConnections.map(c => ({ value: c })));
      setValue('materials', output.materials);
      setValue('challenges', output.challenges);
      setValue('bestPractice', output.bestPractice);

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

  const handleFinalizeAndCheckin = async (data: any) => {
    const params = new URLSearchParams();
    
    // The details object now contains the full, user-edited plan
    const details = {
        timeBlocks: data.timeBlocks,
        multiWinConnections: data.multiWinConnections.map((c: {value: string}) => c.value),
        materials: data.materials,
        challenges: data.challenges,
        bestPractice: data.bestPractice,
    };

    const planData = {
      primaryMission: data.primaryMission,
      details: details,
      needsBudget: data.needsBudget,
      budgetAmount: data.budgetAmount,
      budgetTitle: data.budgetTitle,
    };

    params.set('plan', encodeURIComponent(JSON.stringify(planData)));
    params.set('tab', 'check-in');
    router.push(`/forms?${params.toString()}`);
  }

  const isLoading = isLoadingProfile || isLoadingWeeklyPlan || isLoadingKeyResults;

  if (isLoading) {
    return (
        <Card>
            <CardContent className="flex justify-center items-center p-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Daily Planner</CardTitle>
        <CardDescription>
          Brainstorm with your AI coach, then finalize your plan for submission.
        </CardDescription>
      </CardHeader>
      
      {profile ? (
        <>
            <form onSubmit={handleMissionSubmit(onPlanGenerate)}>
                 <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="primaryMission" className="text-lg">What is your main focus for today?</Label>
                        <Input
                            id="primaryMission"
                            placeholder="e.g., Finalize RED Campaign report and meet new partners."
                            {...registerMission('primaryMission')}
                        />
                        {missionErrors.primaryMission && (
                            <p className="text-sm text-destructive">{missionErrors.primaryMission.message}</p>
                        )}
                    </div>
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
                        {isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Brainstorm My Daily Plan
                    </Button>
                </CardFooter>
            </form>
          
          {isGeneratingPlan && (
              <div className="flex flex-col items-center justify-center p-10 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Your AI coach is thinking...</p>
              </div>
          )}

          {aiOutput && !isGeneratingPlan && (
              <form onSubmit={handleSubmit(handleFinalizeAndCheckin)}>
                 <div className="space-y-6 pt-4">
                    <Separator />
                    <CardHeader className="px-6 pt-6 pb-0">
                        <CardTitle className="text-xl text-primary">Your AI-Generated Draft Plan</CardTitle>
                        <CardDescription>Review and edit the AI's suggestions below, then finalize and submit your check-in.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Time Blocks */}
                        <div className="space-y-3">
                            <Label className="font-semibold">Key Time Blocks</Label>
                            {timeBlockFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center">
                                    <Input {...register(`timeBlocks.${index}.startTime`)} placeholder="Start" />
                                    <Input {...register(`timeBlocks.${index}.endTime`)} placeholder="End" />
                                    <Input {...register(`timeBlocks.${index}.description`)} placeholder="Description" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTimeBlock(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendTimeBlock({startTime: '', endTime: '', description: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Time Block</Button>
                        </div>

                         {/* Multi-Win Connections */}
                        <div className="space-y-3">
                            <Label className="font-semibold">Multi-Win Connections</Label>
                             {connectionFields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center">
                                    <Input {...register(`multiWinConnections.${index}.value`)} placeholder="e.g., Connects to KR1..." />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeConnection(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendConnection({value: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Connection</Button>
                        </div>
                        
                        <div className="space-y-2">
                             <Label className="font-semibold">Suggested Resources / Materials</Label>
                             <Textarea {...register('materials')} />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">Potential Challenges & Mitigations</Label>
                             <Textarea {...register('challenges')} />
                        </div>

                         <div className="space-y-2">
                            <Label className="font-semibold">Best Practice Tip</Label>
                             <Textarea {...register('bestPractice')} />
                        </div>

                        <Separator />

                        {/* Budget Requisition */}
                        <div className="space-y-4 rounded-lg border p-4">
                             <div className="flex items-center space-x-2">
                                <Controller
                                    name="needsBudget"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="checkbox"
                                            id="needsBudget"
                                            checked={field.value}
                                            onChange={e => field.onChange(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    )}
                                />
                                <Label htmlFor="needsBudget" className="text-base font-semibold">Do you need a budget for this mission?</Label>
                            </div>

                            {needsBudget && (
                                <div className="space-y-4 pl-6 border-l-2 border-primary ml-2">
                                     <div className="space-y-2">
                                        <Label htmlFor="budgetTitle">Requisition Title</Label>
                                        <Input id="budgetTitle" placeholder="e.g., Transport for Nindye SS Visit" {...register('budgetTitle')} />
                                        {checkinErrors.budgetTitle && <p className="text-sm text-destructive">{checkinErrors.budgetTitle.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="budgetAmount">Amount Required (UGX)</Label>
                                        <Input id="budgetAmount" type="number" placeholder="e.g., 25000" {...register('budgetAmount')} />
                                    </div>
                                </div>
                            )}
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button size="lg" type="submit" disabled={isSubmitting}>
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalize & Proceed to Check-in
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                 </div>
              </form>
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
