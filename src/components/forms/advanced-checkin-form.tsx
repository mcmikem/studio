
'use client';
import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  useCollectionOnce,
} from '@/firebase';
import { collection, serverTimestamp, query, orderBy, where, limit, Timestamp, getDocs } from 'firebase/firestore';
import type { KeyResult, User, Checkout, WeeklyWorkplan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Sparkles, LogIn, Trash2, PlusCircle } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { dailyPlannerAI } from '@/ai/flows/daily-planner-flow';
import { MultiSelect } from '../ui/multi-select';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '../ui/skeleton';
import { startOfWeek } from 'date-fns';
import Link from 'next/link';
import { format } from 'date-fns';


const timeBlockSchema = z.object({
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  description: z.string().min(3, 'Required'),
});

const checkinSchema = z.object({
  mainFocus: z.array(z.string()).min(1, 'Please select at least one main focus.'),
  customTask: z.string().optional(),
  workLocation: z.string().min(1, "Please select your work location."),
  timeBlocks: z.array(timeBlockSchema).optional(),
  multiWinConnections: z.array(z.string()).optional(),
  otherConnection: z.string().optional(),
  teamSupport: z.array(z.string()).optional(),
  budget: z.coerce.number().optional(),
  challenges: z.string().optional(),
  materials: z.string().optional(),
  transport: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

const multiWinOptions = [
    { id: 'volunteer', label: 'Recruit a volunteer' },
    { id: 'content', label: 'Capture content (photos/video)' },
    { id: 'story', label: 'Gather a testimonial or story' },
    { id: 'partner', label: 'Identify a potential new partner' },
    { id: 'process', label: 'Improve a process/template' },
];

function AiPlannerDialog({
  onDraftPlan,
  isAiLoading,
  mission,
  children
}: {
  onDraftPlan: (context: string) => void;
  isAiLoading: boolean;
  mission: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState('');

  const handleDraftClick = () => {
    onDraftPlan(context);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Draft Your Day with AI</DialogTitle>
          <DialogDescription>
            Provide some context about your plan for the mission: <span className="font-semibold">"{mission}"</span>. The AI will use this to create a detailed draft.
          </DialogDescription>
        </DialogHeader>
        <Textarea 
          placeholder="e.g., 'I'm going to Nindye SS to meet the headteacher and identify a good spot for planting 50 trees.'"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button onClick={handleDraftClick} disabled={isAiLoading || !context.trim()}>
            {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Draft My Day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdvancedCheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  
  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      mainFocus: [],
      customTask: '',
      workLocation: 'Office',
      multiWinConnections: [],
      budget: 0,
      timeBlocks: [{ startTime: '09:00', endTime: '11:00', description: '' }],
      teamSupport: [],
      otherConnection: '',
      challenges: '',
      materials: '',
      transport: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "timeBlocks",
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiBestPractice, setAiBestPractice] = useState<string | null>(null);

  const { watch, control, formState: { errors, isSubmitting }, reset, setValue } = form;
  const mainFocus = watch('mainFocus');
  const customTask = watch('customTask');
  
  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);

  const { data: keyResults, isLoading: isLoadingKR } = useCollectionOnce<KeyResult>(keyResultsQuery);

  const [currentWorkplan, setCurrentWorkplan] = useState<WeeklyWorkplan | null>(null);
  const [isLoadingWorkplan, setIsLoadingWorkplan] = useState(true);

  const fetchLastCheckout = useCallback(async () => {
    if (!firestore || !user) return;

    const checkoutQuery = query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    try {
      const querySnapshot = await getDocs(checkoutQuery);
      if (!querySnapshot.empty) {
        const lastCheckout = querySnapshot.docs[0].data() as Checkout;
        if (lastCheckout.tomorrowPlan) {
          setValue('customTask', lastCheckout.tomorrowPlan);
          setValue('mainFocus', ['custom']);
        }
      }
    } catch (error) {
      console.error("Error fetching last checkout:", error);
    }
  }, [firestore, user, setValue]);


  const fetchCurrentWorkplan = useCallback(async () => {
    if (!firestore || !user) return;
    setIsLoadingWorkplan(true);
    const today = new Date();
    const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });

    const workplanQuery = query(
      collection(firestore, 'workplans'),
      where('userId', '==', user.uid),
      where('weekOf', '==', Timestamp.fromDate(weekStartDate)),
      limit(1)
    );

    try {
      const snapshot = await getDocs(workplanQuery);
      if (!snapshot.empty) {
        setCurrentWorkplan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WeeklyWorkplan);
      } else {
        setCurrentWorkplan(null);
        await fetchLastCheckout();
      }
    } catch (e) {
      console.error("Error fetching workplan: ", e);
    } finally {
      setIsLoadingWorkplan(false);
    }
  }, [firestore, user, fetchLastCheckout]);

  useEffect(() => {
    fetchCurrentWorkplan();
  }, [fetchCurrentWorkplan]);

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);
  const { data: teamMembers } = useCollectionOnce<User>(usersQuery);

  const onSubmit = async (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    
    let mission = data.mainFocus.map(focusId => {
      if (focusId === 'custom') return data.customTask;
      if (currentWorkplan?.keyPriorities.includes(focusId)) return focusId;
      const kr = keyResults?.find(k => k.id === focusId);
      return kr ? `${kr.title}: ${kr.description}` : focusId;
    }).filter(Boolean).join('; ');

    const sanitizedDetails = {
        mainFocus: data.mainFocus || [],
        customTask: data.customTask || '',
        workLocation: data.workLocation || 'Not specified',
        timeBlocks: data.timeBlocks || [],
        multiWinConnections: data.multiWinConnections || [],
        otherConnection: data.otherConnection || '',
        teamSupport: data.teamSupport || [],
        budget: data.budget || 0,
        challenges: data.challenges || '',
        materials: data.materials || '',
        transport: data.transport || '',
    };

    const checkinData = {
      primaryMission: mission,
      details: sanitizedDetails,
      userId: user.uid,
      name: profile.name,
      timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    await addDocumentNonBlocking(checkinsCollection, checkinData);

    // If a budget was requested, automatically create an expense report
    if (data.budget && data.budget > 0) {
      const expenseData = {
        userId: user.uid,
        userName: profile.name,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Requisition' as const,
        title: `Budget from Check-in: ${mission}`,
        items: [{
          description: "Funds requested from daily check-in",
          category: 'Other' as const,
          amount: data.budget,
        }],
        totalAmount: data.budget,
        status: 'Pending' as const,
        createdAt: serverTimestamp(),
      };
      const expensesCollection = collection(firestore, 'expenses');
      await addDocumentNonBlocking(expensesCollection, expenseData);
      toast({
        title: 'Daily Plan & Budget Request Submitted!',
        description: 'Your plan is logged and your budget request has been sent for approval.',
      });
    } else {
        toast({
        title: 'Daily Plan Submitted!',
        description: 'Your strategic plan for the day is logged.',
        });
    }
    
    form.reset();
  };

  const handleDraftPlan = async (userContext: string) => {
    if (mainFocus.length === 0 || !profile || !userContext) return;
    
    const tasks = mainFocus.map(focusId => {
      if (focusId === 'custom') return customTask;
      if (currentWorkplan?.keyPriorities.includes(focusId)) return focusId;
      return keyResults?.find(kr => kr.id === focusId)?.description;
    }).filter(Boolean).join(', ');

    if (!tasks) {
        toast({ variant: "destructive", title: "Please select or define a task first." });
        return;
    }

    setIsAiLoading(true);
    setAiBestPractice(null);

    try {
        const draft = await dailyPlannerAI({ task: tasks, role: profile.role, userContext });
        
        reset({
            ...form.getValues(),
            timeBlocks: draft.timeBlocks,
            multiWinConnections: draft.multiWinConnections,
            budget: draft.budget,
            materials: draft.materials,
            challenges: draft.challenges,
            transport: form.getValues().transport, // Keep existing transport value if any
        });

        if (draft.bestPractice) {
          setAiBestPractice(draft.bestPractice);
        }

         toast({
            title: "Plan Drafted!",
            description: "The AI has generated a first draft of your plan. Review and edit as needed.",
        });

    } catch (error) {
        console.error("AI drafting error:", error);
        toast({ variant: "destructive", title: "AI Assistant Error", description: "Could not draft your plan." });
    } finally {
        setIsAiLoading(false);
    }
  };
  
  const missionText = useMemo(() => {
    return mainFocus.map(focusId => {
      if (focusId === 'custom') return customTask;
      if (currentWorkplan?.keyPriorities.includes(focusId)) return focusId;
      const kr = keyResults?.find(k => k.id === focusId);
      return kr ? `${kr.title}: ${kr.description}` : focusId;
    }).filter(Boolean).join('; ') || "Your Mission";
  }, [mainFocus, customTask, keyResults, currentWorkplan]);

  const priorityOptions = useMemo(() => {
    const options = [];
    if (currentWorkplan?.keyPriorities) {
      options.push(...currentWorkplan.keyPriorities.map(p => ({ value: p, label: p })));
    } else if (keyResults) {
      // Only show KRs if no weekly plan exists
      options.push(...keyResults.map(kr => ({ value: kr.id, label: `(Org KR) ${kr.title}: ${kr.description}` })));
    }
    options.push({ value: 'custom', label: 'Custom Task (from last checkout or new)' });
    return options;
  }, [keyResults, currentWorkplan]);


  if (isLoadingWorkplan || isLoadingKR) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!currentWorkplan && !isLoadingWorkplan) {
    return (
        <Alert>
            <AlertTitle>First, Set Your Weekly Plan!</AlertTitle>
            <AlertDescription>
                <p>You haven't set your key priorities for this week yet. Your daily check-in should align with your weekly goals.</p>
                <Button asChild className="mt-4">
                    <Link href="/workplan">Go to Weekly Workplan</Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
  }

  return (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8 mt-6">
          <section className="space-y-4">
              <h3 className="font-semibold text-lg">Section 1: Your Mission</h3>
              <div className="flex justify-between items-center">
                  <Label>Priority Selection</Label>
                   <AiPlannerDialog onDraftPlan={handleDraftPlan} isAiLoading={isAiLoading} mission={missionText}>
                     <Button type="button" variant="outline" size="sm" disabled={isAiLoading || mainFocus.length === 0}>
                        {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Draft my Day with AI
                    </Button>
                   </AiPlannerDialog>
              </div>
              <Controller
                name="mainFocus"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={priorityOptions}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Select from your weekly plan or add a custom task..."
                    animation={0}
                    maxCount={3}
                  />
                )}
              />
            {errors.mainFocus && <p className="text-sm text-destructive">{`${errors.mainFocus.message}`}</p>}
            {form.watch('mainFocus')?.includes('custom') && (<Input {...form.register('customTask')} placeholder="If not in the list, type your custom task here..." className="mt-2"/>)}
          </section>

          {aiBestPractice && (
             <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI-Powered Tip!</AlertTitle>
                <AlertDescription>
                    {aiBestPractice}
                </AlertDescription>
            </Alert>
          )}
          
           <section className="space-y-4">
            <h3 className="font-semibold text-lg">Section 2: Time Blocking</h3>
             {isAiLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             )}
             {!isAiLoading && fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div className="space-y-1">
                            <Label>Start</Label>
                            <Input type="time" {...form.register(`timeBlocks.${index}.startTime`)} />
                        </div>
                         <div className="space-y-1">
                            <Label>End</Label>
                            <Input type="time" {...form.register(`timeBlocks.${index}.endTime`)} />
                        </div>
                    </div>
                    <div className="flex-grow space-y-1">
                        <Label>Description</Label>
                        <Input {...form.register(`timeBlocks.${index}.description`)} placeholder="What will you do?" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={() => append({ startTime: '', endTime: '', description: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Time Block
            </Button>
          </section>

          <section className="space-y-4">
              <h3 className="font-semibold text-lg">Section 3: Multi-Win Framework</h3>
              <p className="text-sm text-muted-foreground">How can this activity create extra value?</p>
                <Controller
                  name="multiWinConnections"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                        {multiWinOptions.map(option => (
                           <div key={option.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`multiwin-${option.id}`}
                                    checked={field.value?.includes(option.label)}
                                    onCheckedChange={checked => {
                                        return checked
                                            ? field.onChange([...(field.value || []), option.label])
                                            : field.onChange(field.value?.filter(v => v !== option.label))
                                    }}
                                />
                               <Label htmlFor={`multiwin-${option.id}`}>{option.label}</Label>
                           </div>
                        ))}
                    </div>
                  )}
                />
              <Input {...form.register('otherConnection')} placeholder="Other connection opportunity..."/>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Section 4: Logistics & Support</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Location</Label>
                <Controller
                  name="workLocation"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Field">Field</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                 {errors.workLocation && <p className="text-sm text-destructive">{`${errors.workLocation.message}`}</p>}
              </div>
              <div className="space-y-2">
                <Label>Budget Required (UGX)</Label>
                <Input {...form.register('budget')} type="number" placeholder="e.g., 50000" />
              </div>
               <div className="space-y-2">
                <Label>Transport Needed</Label>
                <Input {...form.register('transport')} placeholder="e.g., Boda boda to Mpigi Town" />
              </div>
               <div className="space-y-2">
                <Label>Materials Needed</Label>
                <Input {...form.register('materials')} placeholder="e.g., Chart paper, markers" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Needed From</Label>
               <Controller
                name="teamSupport"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={teamMembers?.map(m => ({ value: m.name, label: m.name })) || []}
                    onValueChange={field.onChange}
                    defaultValue={field.value || []}
                    placeholder="Select team members..."
                    animation={0}
                    maxCount={2}
                  />
                )}
              />
            </div>
             <div className="space-y-2">
                <Label>Potential Challenges</Label>
                <Textarea {...form.register('challenges')} placeholder="What obstacles might you face?" />
              </div>
          </section>
        </div>
        <div className="pt-6">
          <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<LogIn className="mr-2 h-5 w-5" />)}
            Submit Daily Plan
          </Button>
        </div>
      </form>
  );
}

    