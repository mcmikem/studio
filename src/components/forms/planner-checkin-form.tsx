
'use client';

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
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
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, getDocs, Timestamp, limit, serverTimestamp } from 'firebase/firestore';
import type { KeyResult, WeeklyWorkplan, DailyPlannerAIOutput, TaskTemplate } from '@/lib/types';
import { dailyPlannerAI } from '@/ai/flows/daily-planner-flow';
import { Loader2, Sparkles, ArrowRight, PlusCircle, Trash2, ListChecks, ThumbsUp, ThumbsDown, BrainCircuit, Link as LinkIcon, Puzzle, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startOfWeek } from 'date-fns';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Skeleton } from '../ui/skeleton';

const planSchema = z.object({
  primaryMission: z.string().min(10, 'Please describe your main focus for the day.'),
  mood: z.string().min(1, 'Please select your current mood.'),
});

type PlanFormData = z.infer<typeof planSchema>;

const finalCheckinSchema = z.object({
    primaryMission: z.string(),
    mood: z.string(),
    timeBlocks: z.array(z.object({
        startTime: z.string().min(1, 'Start time is required.'),
        endTime: z.string().min(1, 'End time is required.'),
        description: z.string().min(1, 'Description cannot be empty.')
    })).optional(),
    multiWinConnections: z.array(z.object({ value: z.string().min(1, 'Connection cannot be empty.') })).optional(),
    materials: z.string().optional(),
    challenges: z.string().optional(),
    bestPractice: z.string().optional(),
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 seconds

function PlannerCheckinFormComponent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'retrying' | 'error'>('idle');
  const [aiOutput, setAiOutput] = useState<DailyPlannerAIOutput | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoadingWeeklyPlan, setIsLoadingWeeklyPlan] = useState(true);

  const fetchWeeklyPlan = useCallback(async () => {
    if (!user || !firestore) {
        setIsLoadingWeeklyPlan(false);
        return;
    }
    setIsLoadingWeeklyPlan(true);
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    start.setHours(0,0,0,0);
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
  }, [user, firestore]);

  useEffect(() => {
    fetchWeeklyPlan();
  }, [fetchWeeklyPlan]);

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'));
  }, [firestore]);
  const { data: keyResults, isLoading: isLoadingKeyResults } = useCollection<KeyResult>(keyResultsQuery);

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'task-templates'), where('title', '!=', ''));
  }, [firestore]);
  const { data: taskTemplates } = useCollection<TaskTemplate>(templatesQuery);

  const { register: registerMission, handleSubmit: handleMissionSubmit, setValue: setMissionValue, control: missionControl, getValues: getMissionValues, formState: { errors: missionErrors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
     defaultValues: {
      mood: 'energized'
    }
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors: checkinErrors, isSubmitting } } = useForm<z.infer<typeof finalCheckinSchema>>({
    resolver: zodResolver(finalCheckinSchema),
    defaultValues: {
        primaryMission: "",
        mood: "",
        timeBlocks: [],
        multiWinConnections: [],
        materials: "",
        challenges: "",
        bestPractice: "",
    }
  });

  const { fields: timeBlockFields, append: appendTimeBlock, remove: removeTimeBlock } = useFieldArray({ control, name: "timeBlocks" });
  const { fields: connectionFields, append: appendConnection, remove: removeConnection } = useFieldArray({ control, name: "multiWinConnections" });

  const onPlanGenerate = async (data: PlanFormData) => {
    if (!profile || !keyResults) {
      toast({
        variant: 'destructive',
        title: 'Missing Context',
        description: 'User profile or organizational data is not yet loaded. Please wait and try again.',
      });
      return;
    }

    setGenerationStatus('loading');
    setAiOutput(null);
    setFeedbackSubmitted(false);

    const serializableKeyResults = keyResults.map(kr => ({
      ...kr,
      deadline: kr.deadline ? new Date(kr.deadline).toISOString().split('T')[0] : 'N/A',
      createdAt: undefined, 
    }));

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        try {
          const output = await dailyPlannerAI({
            userName: profile.name,
            userRole: profile.role,
            primaryMission: data.primaryMission,
            weeklyPriorities: weeklyPlan?.individualTasks || [],
            keyResults: serializableKeyResults,
          });
          setAiOutput(output);
          setValue('primaryMission', data.primaryMission);
          setValue('mood', data.mood);
          setValue('timeBlocks', output.timeBlocks);
          setValue('multiWinConnections', output.multiWinConnections.map(c => ({ value: c })));
          setValue('materials', output.materials);
          setValue('challenges', output.challenges);
          setValue('bestPractice', output.bestPractice);
          setGenerationStatus('idle');
          return;
        } catch (error: any) {
           console.error(`AI generation attempt ${attempt} failed:`, error);
           if (error.message?.includes('503') && attempt <= MAX_RETRIES) {
                setGenerationStatus('retrying');
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
           } else {
                setGenerationStatus('error');
                const missionData = getMissionValues();
                setValue('primaryMission', missionData.primaryMission);
                setValue('mood', missionData.mood);
                setValue('timeBlocks', [{startTime: '09:00 AM', endTime: '11:00 AM', description: ''}]);
                setValue('multiWinConnections', []);
                return;
           }
        }
    }
  };
  
  const applyTemplate = (template: TaskTemplate) => {
    const checklistText = template.checklistItems.map(item => `- ${item}`).join('\n');
    const newMissionText = `My focus is completing the '${template.title}' task. The steps are:\n${checklistText}`;
    setMissionValue('primaryMission', newMissionText);
    toast({ title: "Template Applied!", description: `"${template.title}" checklist has been added to your mission.` });
  };


  const handleFinalizeAndCheckin = async (data: any) => {
    const params = new URLSearchParams();
    
    const details = {
        timeBlocks: data.timeBlocks,
        multiWinConnections: data.multiWinConnections.map((c: {value: string}) => c.value),
        materials: data.materials,
        challenges: data.challenges,
        bestPractice: data.bestPractice,
    };

    const planData = {
      primaryMission: data.primaryMission,
      mood: data.mood,
      details: details,
    };

    params.set('plan', encodeURIComponent(JSON.stringify(planData)));
    router.push(`/forms/check-in?${params.toString()}`);
  }
  
  const handleManualCheckin = async () => {
    if (!user || !profile || !firestore) {
        toast({ variant: 'destructive', title: 'Not logged in' });
        return;
    }
    const missionData = getMissionValues();
    
    const checkinData = {
        userId: user.uid,
        name: profile.name,
        primaryMission: missionData.primaryMission,
        mood: missionData.mood,
        timestamp: serverTimestamp(),
    };
    
    try {
        await addDocumentNonBlocking(collection(firestore, 'checkins'), checkinData);
        toast({ title: 'Manual Check-in Submitted!', description: 'Your plan is visible to the team.'});
        router.push('/');
    } catch(e) {
        console.error("Manual checkin failed", e);
        toast({ variant: 'destructive', title: 'Submission Failed' });
    }
  }

  const isLoading = isLoadingProfile || isLoadingWeeklyPlan || isLoadingKeyResults;
  const isGeneratingPlan = generationStatus === 'loading' || generationStatus === 'retrying';

  const showFinalForm = (aiOutput || generationStatus === 'error') && !isGeneratingPlan;

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
      
      {profile ? (
        <>
            <form onSubmit={handleMissionSubmit(onPlanGenerate)}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="primaryMission" className="text-lg">What is your main focus for the day?</Label>
                        <Textarea
                            id="primaryMission"
                            placeholder="e.g., Finalize RED Campaign report and meet new partners. Also need to follow up with the tech team on the website updates."
                            {...registerMission('primaryMission')}
                            className="min-h-[100px]"
                        />
                        {missionErrors.primaryMission && (
                            <p className="text-sm text-destructive">{missionErrors.primaryMission.message}</p>
                        )}
                    </div>

                      <div className="space-y-3">
                        <Label className="text-lg">How are you feeling today?</Label>
                        <Controller
                            name="mood"
                            control={missionControl}
                            render={({ field }) => (
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-4"
                                >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="energized" id="energized" />
                                    <Label htmlFor="energized" className="cursor-pointer">⚡️ Energized &amp; Ready</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="focused" id="focused" />
                                    <Label htmlFor="focused" className="cursor-pointer">🎯 Focused</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="calm" id="calm" />
                                    <Label htmlFor="calm" className="cursor-pointer">🧘‍♀️ Calm &amp; Steady</Label>
                                </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="overwhelmed" id="overwhelmed" />
                                    <Label htmlFor="overwhelmed" className="cursor-pointer">🥵 A Bit Overwhelmed</Label>
                                </div>
                                </RadioGroup>
                            )}
                        />
                          {missionErrors.mood && (
                            <p className="text-sm text-destructive">{missionErrors.mood.message}</p>
                        )}
                    </div>
                    
                    {weeklyPlan && (
                        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <AlertTitle>Your Personal Priorities This Week</AlertTitle>
                            <AlertDescription>
                            <ul className="list-disc list-inside">
                                {weeklyPlan.individualTasks.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex-wrap gap-4">
                    <Button type="submit" disabled={isGeneratingPlan} size="lg">
                        {isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {generationStatus === 'loading' ? 'Generating...' : generationStatus === 'retrying' ? 'Retrying...' : 'Brainstorm My Daily Plan'}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="lg">
                                <ListChecks className="mr-2 h-4 w-4" />
                                Use a Template
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {taskTemplates && taskTemplates.length > 0 ? (
                                taskTemplates.map(template => (
                                    <DropdownMenuItem key={template.id} onClick={() => applyTemplate(template)}>
                                        {template.title}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>No templates found.</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </form>
          
          {isGeneratingPlan && (
              <div className="flex flex-col items-center justify-center p-10 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{generationStatus === 'retrying' ? 'AI is busy, retrying...' : 'Your AI coach is thinking...'}</p>
              </div>
          )}
          
          {showFinalForm && (
              <form onSubmit={handleSubmit(handleFinalizeAndCheckin)}>
                 <div className="space-y-6 pt-4">
                    <Separator />
                    <CardHeader className="px-6 pt-6 pb-0">
                         {generationStatus === 'error' ? (
                            <Alert variant="destructive">
                                <AlertTitle>AI Planner Unavailable</AlertTitle>
                                <AlertDescription>The AI assistant couldn't generate a plan. Please fill out your plan manually below.</AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <CardTitle className="text-xl text-primary">Your AI-Generated Draft Plan</CardTitle>
                                <CardDescription>Review and edit the AI's suggestions below, then finalize and submit your check-in.</CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Time Blocks */}
                        <div className="space-y-3">
                            <Label className="font-semibold text-base flex items-center gap-2"><ListChecks className="h-5 w-5" /> Key Time Blocks</Label>
                            {timeBlockFields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-lg space-y-2 relative">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor={`timeBlocks.${index}.startTime`}>Start Time</Label>
                                            <Input id={`timeBlocks.${index}.startTime`} {...register(`timeBlocks.${index}.startTime`)} placeholder="e.g., 09:00 AM" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`timeBlocks.${index}.endTime`}>End Time</Label>
                                            <Input id={`timeBlocks.${index}.endTime`} {...register(`timeBlocks.${index}.endTime`)} placeholder="e.g., 11:00 AM" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`timeBlocks.${index}.description`}>Description</Label>
                                        <Textarea id={`timeBlocks.${index}.description`} {...register(`timeBlocks.${index}.description`)} placeholder="Description of the task or event" />
                                         {checkinErrors.timeBlocks?.[index]?.description && <p className="text-sm text-destructive">{checkinErrors.timeBlocks?.[index]?.description?.message}</p>}
                                    </div>
                                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTimeBlock(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendTimeBlock({startTime: '', endTime: '', description: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Time Block</Button>
                        </div>
                        <Separator/>
                         {/* Multi-Win Connections */}
                        <div className="space-y-3">
                            <Label className="font-semibold text-base flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Multi-Win Connections</Label>
                             {connectionFields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center">
                                    <Input {...register(`multiWinConnections.${index}.value`)} placeholder="e.g., Connects to KR1..." />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeConnection(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendConnection({value: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Connection</Button>
                        </div>
                        <Separator/>
                        <div className="space-y-2">
                             <Label className="font-semibold text-base flex items-center gap-2"><Wrench className="h-5 w-5" /> Suggested Resources</Label>
                             <Textarea {...register('materials')} />
                        </div>
                        <Separator/>
                        <div className="space-y-2">
                            <Label className="font-semibold text-base flex items-center gap-2"><Puzzle className="h-5 w-5" /> Potential Challenges</Label>
                             <Textarea {...register('challenges')} />
                        </div>
                        <Separator/>
                         <div className="space-y-2">
                            <Label className="font-semibold text-base flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Best Practice Tip</Label>
                             <Textarea {...register('bestPractice')} />
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button size="lg" type="submit" disabled={isSubmitting}>
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalize &amp; Proceed to Check-in
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
        <Suspense fallback={<Card><CardContent><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>}>
            <PlannerCheckinFormComponent />
        </Suspense>
    )
}
