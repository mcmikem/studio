
'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, UseFormReturn, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, serverTimestamp, query, where, limit, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import type { Checkout, WeeklyWorkplan, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, LogIn, Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfWeek } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { dailyPlannerAI } from '@/ai/flows/daily-planner-flow';
import { Input } from '../ui/input';
import { MultiSelect } from '../ui/multi-select';
import { Separator } from '../ui/separator';

const checkinSchema = z.object({
  primaryMission: z.string().min(10, 'Please provide a clear mission for the day.'),
  timeBlocks: z.array(z.object({
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    description: z.string().min(3),
  })).optional(),
  multiWinConnections: z.array(z.string()).optional(),
  budget: z.coerce.number().optional(),
  materials: z.string().optional(),
  challenges: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

const multiWinOptions = [
  { value: 'Recruit a volunteer', label: 'Recruit a volunteer' },
  { value: 'Capture content (photos/video)', label: 'Capture content (photos/video)' },
  { value: 'Gather a testimonial or story', label: 'Gather a testimonial or story' },
  { value: 'Identify a potential new partner', label: 'Identify a potential new partner' },
  { value: 'Improve a process/template', label: 'Improve a process/template' },
];


function PlannerForm({
    form,
    profile,
    onSubmit,
    isSubmitting,
    isDirty,
}: {
    form: UseFormReturn<CheckinFormData>,
    profile: User | null,
    onSubmit: (data: CheckinFormData) => void,
    isSubmitting: boolean,
    isDirty: boolean,
}) {
  const { register, handleSubmit, formState: { errors }, setValue, control, getValues } = form;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'timeBlocks',
  });

  const { toast } = useToast();
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

   const handleGeneratePlan = async () => {
    if (!profile) return;
    const mission = control._getWatch('primaryMission');
    if (!mission) {
        toast({variant: 'destructive', title: "Please enter your mission first."});
        return;
    }
    setIsGeneratingPlan(true);
    try {
        const result = await dailyPlannerAI({
            task: mission,
            role: profile.role,
            userContext: 'First draft of my plan for today.'
        });
        
        setValue('timeBlocks', result.timeBlocks.length > 0 ? result.timeBlocks : [{startTime: "", endTime: "", description: ""}]);
        setValue('multiWinConnections', result.multiWinConnections);
        setValue('budget', result.budget);
        setValue('materials', result.materials);
        setValue('challenges', result.challenges);
        setPlanGenerated(true);

    } catch(e) {
        console.error(e);
        toast({variant: 'destructive', title: "AI Planner Failed", description: "Could not generate a plan. Please fill it manually."})
    } finally {
        setIsGeneratingPlan(false);
    }
  }


    return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className='space-y-2'>
            <Label htmlFor="primaryMission">What is your single most important mission for today?</Label>
            <Textarea
                id="primaryMission"
                {...register('primaryMission')}
                placeholder="e.g., Finalize the RED Campaign report and submit to GlobalGiving."
                className="min-h-[100px]"
            />
            {errors.primaryMission && <p className="text-sm text-destructive mt-2">{errors.primaryMission.message}</p>}
          </div>

           <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>AI Productivity Coach</AlertTitle>
            <AlertDescription>
                <p className="mb-4">Once your mission is set, let our AI assistant generate a strategic first draft of your daily schedule.</p>
                <Button type="button" onClick={handleGeneratePlan} disabled={isGeneratingPlan || !getValues('primaryMission')}>
                    {isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                    Generate AI Plan
                </Button>
            </AlertDescription>
          </Alert>
          
          { (planGenerated || isDirty) && !isGeneratingPlan && (
              <div className="space-y-6 pt-4">
                <Separator />
                 <div className="space-y-2">
                    <Label>Time Blocks</Label>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <Input {...register(`timeBlocks.${index}.startTime`)} placeholder="09:00" />
                            <Input {...register(`timeBlocks.${index}.endTime`)} placeholder="11:00" />
                            <Input {...register(`timeBlocks.${index}.description`)} placeholder="Task description..." className="flex-grow" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({startTime: "", endTime: "", description: ""})}><PlusCircle className="mr-2 h-4 w-4" /> Add Block</Button>
                 </div>
                
                 <div className="space-y-2">
                    <Label>Multi-Win Connections</Label>
                    <MultiSelect 
                        options={multiWinOptions}
                        onValueChange={(value) => setValue('multiWinConnections', value)}
                        defaultValue={control._getWatch('multiWinConnections') || []}
                        placeholder="Select connections..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Suggested Budget (UGX)</Label>
                        <Input type="number" {...register('budget')} placeholder="50000" />
                     </div>
                      <div className="space-y-2">
                        <Label>Materials Needed</Label>
                        <Input {...register('materials')} placeholder="e.g., Flipcharts, markers" />
                     </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Potential Challenges</Label>
                    <Input {...register('challenges')} placeholder="e.g., Boda boda availability" />
                 </div>

                 <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<LogIn className="mr-2 h-5 w-5" />)}
                    Check In & Submit Final Plan
                </Button>
              </div>
          )}
        </form>
    );
}


export function PlannerCheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user);
  
  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
        primaryMission: '',
        timeBlocks: [{startTime: "", endTime: "", description: ""}],
        multiWinConnections: [],
    }
  });

  const { formState: { isSubmitting, isDirty }, setValue, reset } = form;
  const [initialMission, setInitialMission] = useState<string | null>(null);

  // Effect to fetch context and set initial mission suggestion
  useEffect(() => {
    if (firestore && user && !isDirty) {
      const fetchContext = async () => {
        let mission: string | null = null;
        
        const today = new Date();
        const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
        const workplanQuery = query(
          collection(firestore, 'workplans'),
          where('userId', '==', user.uid),
          where('weekOf', '==', Timestamp.fromDate(weekStartDate)),
          limit(1)
        );

        const workplanSnapshot = await getDocs(workplanQuery);
        if (!workplanSnapshot.empty) {
          const plan = workplanSnapshot.docs[0].data() as WeeklyWorkplan;
          mission = `My priorities this week are: ${plan.keyPriorities.join(', ')}. Today I will focus on...`;
        } else {
            const checkoutQuery = query(
                collection(firestore, 'checkouts'),
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const checkoutSnapshot = await getDocs(checkoutQuery);
            if (!checkoutSnapshot.empty) {
                const lastCheckout = checkoutSnapshot.docs[0].data() as Checkout;
                if (lastCheckout.tomorrowPlan) {
                    mission = lastCheckout.tomorrowPlan;
                }
            }
        }
        setInitialMission(mission);
      };

      fetchContext();
    }
  }, [firestore, user, isDirty]);

  // Effect to populate form only when initial mission is fetched and form is clean
  useEffect(() => {
    if (initialMission && !isDirty) {
      setValue('primaryMission', initialMission);
    }
  }, [initialMission, isDirty, setValue]);


  const onSubmit = async (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }

    const checkinData = {
      primaryMission: data.primaryMission,
      details: {
          timeBlocks: data.timeBlocks,
          multiWinConnections: data.multiWinConnections,
          budget: data.budget,
          materials: data.materials,
          challenges: data.challenges,
      },
      userId: user.uid,
      name: profile.name,
      timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    await addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({
      title: 'Daily Plan Submitted!',
      description: 'Your mission for the day is logged.',
    });
    reset();
  };
  
  if (isLoadingProfile) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-in & Strategic Planner</CardTitle>
        <CardDescription>
          State your mission, let the AI draft your plan, then execute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlannerForm
            form={form}
            profile={profile}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            isDirty={isDirty}
        />
         <Alert variant="default" className="mt-6">
            <AlertTitle>No Weekly Plan?</AlertTitle>
            <AlertDescription>
                <p>For more effective planning, set your priorities for the week. Your daily check-in will automatically start with them.</p>
                <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href="/workplan">Set Your Weekly Workplan</Link>
                </Button>
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
