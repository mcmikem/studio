

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, limit, Timestamp, getDocs, doc, addDoc } from 'firebase/firestore';
import type { TeamWeeklyPlan, User, PriorityItem } from '@/lib/types';
import { getWeek, startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarClock, Loader2, Wand } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { parseWorkplan } from '@/ai/flows/parse-workplan-flow';
import { createAlert } from '@/ai/flows/create-alert-flow';

const priorityItemSchema = z.object({
  activity: z.string().min(1, 'Activity description is required.'),
  priority: z.enum(['High', 'Medium', 'Low']),
  responsible: z.array(z.string()).min(1, 'At least one person must be responsible.'),
  deadline: z.string().optional(),
});


const teamWorkplanSchema = z.object({
  keyPriorities: z.array(priorityItemSchema).min(1, 'At least one priority is required.'),
  message: z.string().min(5, "A brief message is required."),
  status: z.enum(['Draft', 'Published']),
});

type TeamWorkplanFormData = z.infer<typeof teamWorkplanSchema>;

const formatDateForInput = (date: Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
        const d = (date as Timestamp).toDate ? (date as Timestamp).toDate() : new Date(date as string);
        return format(d, 'yyyy-MM-dd');
    } catch {
        return '';
    }
};

function TeamWorkplanForm({
    weekOf,
    existingPlan,
    onPlanSaved,
    users
  }: {
    weekOf: Date;
    existingPlan?: TeamWeeklyPlan | null;
    onPlanSaved: () => void;
    users: User[];
  }) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeamWorkplanFormData>({
    resolver: zodResolver(teamWorkplanSchema),
    defaultValues: existingPlan
      ? {
          status: existingPlan.status,
          message: existingPlan.message,
          keyPriorities: existingPlan.keyPriorities.map(p => ({
              activity: p.activity,
              priority: p.priority || 'Medium',
              responsible: Array.isArray(p.responsible) ? p.responsible : [p.responsible],
              deadline: p.deadline ? formatDateForInput(p.deadline) : '',
          }))
        }
      : {
          keyPriorities: [{ activity: '', priority: 'Medium', responsible: [], deadline: '' }],
          message: '',
          status: 'Draft',
        },
  });

  useEffect(() => {
    reset(existingPlan
      ? {
          status: existingPlan.status,
          message: existingPlan.message,
           keyPriorities: existingPlan.keyPriorities.map(p => ({
              activity: p.activity,
              priority: p.priority || 'Medium',
              responsible: Array.isArray(p.responsible) ? p.responsible : [p.responsible],
              deadline: p.deadline ? formatDateForInput(p.deadline) : '',
          }))
        }
      : {
          keyPriorities: [{ activity: '', priority: 'Medium', responsible: [], deadline: '' }],
          message: '',
          status: 'Draft',
        });
  }, [existingPlan, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keyPriorities',
  });

  const responsibleOptions = users
    ? [
        ...users.map(u => ({ label: u.name, value: u.name })),
        { label: 'All Members', value: 'All Members' },
        { label: 'Volunteers', value: 'Volunteers' },
        { label: 'Interns', value: 'Interns' },
      ]
    : [];

    const handleParseWithAI = async () => {
        if (!pastedText.trim()) {
            toast({ variant: 'destructive', title: 'No text provided', description: 'Please paste your workplan text into the box.' });
            return;
        }
        setIsParsing(true);
        try {
            const parsedData = await parseWorkplan({ textPlan: pastedText });
            
            // Map responsible strings to valid options, defaulting to 'All Members' if not found
            const validPriorities = parsedData.keyPriorities.map(p => {
                const validResponsible = p.responsible.filter(r => responsibleOptions.some(option => option.value === r));
                return {
                    ...p,
                    responsible: validResponsible.length > 0 ? validResponsible : ['All Members'],
                    deadline: p.deadline || ''
                };
            });

            reset({
                message: parsedData.message,
                keyPriorities: validPriorities,
                status: 'Draft' // Default to draft after parsing
            });

            toast({ title: 'Plan Parsed!', description: 'The AI has filled out the form for you. Please review and save.' });
        } catch (error) {
            console.error("AI parsing error:", error);
            toast({ variant: 'destructive', title: 'AI Parsing Failed', description: 'Could not understand the provided text. Please try rephrasing.' });
        } finally {
            setIsParsing(false);
        }
    };

  const onSubmit = async (data: TeamWorkplanFormData) => {
    if (!user || !profile || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    // ** FIX: Normalize the timestamp to the start of the week **
    const weekStartDate = startOfWeek(weekOf, { weekStartsOn: 1 });
    weekStartDate.setHours(0, 0, 0, 0); // Set to midnight

    const planData = {
        weekOf: Timestamp.fromDate(weekStartDate),
        keyPriorities: data.keyPriorities.map(p => {
          const priority: Partial<PriorityItem> = {
            activity: p.activity,
            priority: p.priority,
            responsible: p.responsible,
          };
          if (p.deadline) {
            priority.deadline = Timestamp.fromDate(new Date(p.deadline));
          }
          return priority;
        }),
        message: data.message,
        authorId: user.uid,
        authorName: profile.name,
        status: data.status,
    };

    try {
        const wasPreviouslyDraft = existingPlan?.status === 'Draft' || !existingPlan;

        if(existingPlan) {
            const planRef = doc(firestore, 'team-workplans', existingPlan.id);
            await updateDocumentNonBlocking(planRef, {
                ...planData,
                keyPriorities: planData.keyPriorities as PriorityItem[], // Ensure correct type
            });
            toast({ title: 'Plan Updated!', description: `The plan for the week has been updated.` });

        } else {
             await addDoc(collection(firestore, 'team-workplans'), {
                ...planData,
                createdAt: Timestamp.now(),
            });
            toast({ title: 'Plan Saved!', description: `The team plan for the week has been saved as a ${data.status}.` });
        }

        // If the plan is being published for the first time
        if (data.status === 'Published' && wasPreviouslyDraft) {
            await createAlert({
                type: 'Info',
                priority: 'Medium',
                message: `${profile.name} has published the workplan for the week of ${format(weekStartDate, 'MMM d')}.`,
                action: '/workplan',
                creatorId: user.uid,
            });
        }

        onPlanSaved();
    } catch (e) {
        console.error("Failed to save team plan:", e)
        toast({ variant: 'destructive', title: 'Error saving plan', description: 'Please try again.'})
    }
  };

  return (
    <Card>
        <CardHeader>
             <CardTitle>{existingPlan ? 'Edit Team Plan' : 'Create New Team Plan'}</CardTitle>
             <CardDescription>Set the high-level priorities and message for the entire team for this week, or paste your plan below to have AI fill the form.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
            <div className="space-y-2">
                <Label htmlFor="paste-area">Paste Your Workplan Text Here</Label>
                <Textarea
                    id="paste-area"
                    placeholder="Paste your unstructured weekly plan notes here..."
                    className="min-h-[120px]"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                />
            </div>
             <Button type="button" onClick={handleParseWithAI} disabled={isParsing}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                Parse with AI
            </Button>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6 border-t">
                
                {/* Priorities Field Array */}
                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Key Team Priorities</Label>
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                            <div className="space-y-2">
                                <Label htmlFor={`keyPriorities.${index}.activity`}>Activity</Label>
                                <Input id={`keyPriorities.${index}.activity`} {...register(`keyPriorities.${index}.activity`)} placeholder={`Priority Activity #${index + 1}`}/>
                                {errors.keyPriorities?.[index]?.activity && <p className="text-sm text-destructive">{errors.keyPriorities[index]?.activity?.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`keyPriorities.${index}.priority`}>Priority</Label>
                                    <Controller
                                        control={control}
                                        name={`keyPriorities.${index}.priority`}
                                        render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Set priority" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`keyPriorities.${index}.deadline`}>Deadline (Optional)</Label>
                                    <Input id={`keyPriorities.${index}.deadline`} type="date" {...register(`keyPriorities.${index}.deadline`)} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`keyPriorities.${index}.responsible`}>Responsible</Label>
                                    <Controller
                                    control={control}
                                    name={`keyPriorities.${index}.responsible`}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={responsibleOptions}
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            placeholder="Assign to..."
                                        />
                                    )}
                                />
                                    {errors.keyPriorities?.[index]?.responsible && <p className="text-sm text-destructive">{errors.keyPriorities[index]?.responsible?.message}</p>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {errors.keyPriorities?.root && <p className="text-sm text-destructive">{errors.keyPriorities.root.message}</p>}
                </div>
                
                <Button type="button" variant="outline" size="sm" onClick={() => append({ activity: '', priority: 'Medium', responsible: [], deadline: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Priority
                </Button>

                 <div className="space-y-2">
                    <Label htmlFor="message" className="text-lg font-semibold">Weekly Message/Focus</Label>
                    <Textarea id="message" {...register('message')} placeholder="e.g., 'This week is all about finalizing our Q3 reports and preparing for the partner visits...'" />
                    {errors.message && <p className="text-sm text-destructive">{`${errors.message.message}`}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="status" className="text-lg font-semibold">Status</Label>
                     <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft (Visible only to management)</SelectItem>
                                    <SelectItem value="Published">Published (Visible to the whole team)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isSubmitting} size="lg">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingPlan ? 'Save Changes to Plan' : 'Save Team Plan'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}


export default function TeamWorkplansPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPlan, setCurrentPlan] = useState<TeamWeeklyPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  const firestore = useFirestore();
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(
    useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore])
  );

  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const fetchTeamPlan = useCallback(async () => {
    if (!firestore) return;
    setIsLoadingPlan(true);

    const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    startOfSelectedWeek.setHours(0, 0, 0, 0); // Normalize to midnight
    const weekStartTimestamp = Timestamp.fromDate(startOfSelectedWeek);

    const q = query(
      collection(firestore, 'team-workplans'),
      where('weekOf', '==', weekStartTimestamp),
      limit(1)
    );

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setCurrentPlan({ id: doc.id, ...doc.data() } as TeamWeeklyPlan);
      } else {
        setCurrentPlan(null);
      }
    } catch (e) {
      console.error("Error fetching team workplan:", e);
    } finally {
      setIsLoadingPlan(false);
    }
  }, [firestore, currentDate]);

  useEffect(() => {
    fetchTeamPlan();
  }, [fetchTeamPlan]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  
  const priorityColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
  };
  
  const isLoading = isLoadingPlan || isLoadingUsers;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle>Team Weekly Plans</CardTitle>
                <CardDescription>
                Week {getWeek(currentDate, { weekStartsOn: 1 })}: {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
                </CardDescription>
             </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
          ) : (
             <TeamWorkplanForm weekOf={currentDate} existingPlan={currentPlan} onPlanSaved={fetchTeamPlan} users={users || []} />
          )}
        </CardContent>
      </Card>

      {currentPlan && !isLoading && (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Current Plan Summary
                    <Badge variant={currentPlan.status === 'Published' ? 'default' : 'secondary'}>{currentPlan.status}</Badge>
                </CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                <Alert>
                    <AlertTitle>Message from {currentPlan.authorName}</AlertTitle>
                    <AlertDescription>"{currentPlan.message}"</AlertDescription>
                </Alert>
                 <div>
                    <h4 className="font-semibold mb-2">Key Priorities for the Week:</h4>
                    <div className="space-y-3">
                        {currentPlan.keyPriorities.map((p, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start">
                                  <p className="font-medium pr-4">{p.activity}</p>
                                  <Badge variant="outline" className={priorityColors[p.priority]}>{p.priority}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 space-x-4">
                                  <span><span className="font-semibold">By:</span> {(Array.isArray(p.responsible) ? p.responsible.join(', ') : p.responsible)}</span>
                                  {p.deadline && <span><span className="font-semibold">Due:</span> {format(p.deadline instanceof Timestamp ? p.deadline.toDate() : new Date(p.deadline), 'MMM dd')}</span>}
                              </div>
                          </div>
                        ))}
                    </div>
                 </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
