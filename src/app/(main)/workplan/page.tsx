
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, limit, Timestamp, getDocs, doc } from 'firebase/firestore';
import type { WeeklyWorkplan, TeamWeeklyPlan, PriorityItem } from '@/lib/types';
import { getWeek, startOfWeek, endOfWeek, format, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarCheck, Loader2, Wand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createAlertAction as createAlert } from '@/actions/mutations';
import { PageHeader } from '@/components/page-header';

const individualTaskSchema = z.object({
  value: z.string().min(1, 'Task description cannot be empty.'),
});

const workplanSchema = z.object({
  individualTasks: z.array(individualTaskSchema).min(1, 'Please add at least one personal task.'),
});

type WorkplanFormData = z.infer<typeof workplanSchema>;

function FinalizeWorkplanForm({
  teamPlan,
  onPlanCreated,
}: {
  teamPlan: TeamWeeklyPlan | null; // Can be null now
  onPlanCreated: () => void;
}) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WorkplanFormData>({
    resolver: zodResolver(workplanSchema),
    defaultValues: {
      individualTasks: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'individualTasks',
  });

  const onSubmit = async (data: WorkplanFormData) => {
    if (!user || !profile || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    weekStartDate.setHours(0, 0, 0, 0);

    const newPlan: Partial<WeeklyWorkplan> = {
      userId: user.uid,
      userName: profile.name,
      weekOf: Timestamp.fromDate(weekStartDate),
      individualTasks: data.individualTasks.map(t => t.value),
      createdAt: Timestamp.now(),
      // Conditionally add team plan info
      ...(teamPlan && {
        teamPlanId: teamPlan.id,
        teamPriorities: teamPlan.keyPriorities,
      }),
    };

    const workplansCollection = collection(firestore, 'workplans');
    await addDocumentNonBlocking(workplansCollection, newPlan);

    toast({
      title: 'Workplan Saved!',
      description: `Your plan for the week has been finalized.`,
    });

    await createAlert({
      type: 'Info',
      priority: 'Low',
      message: `${profile.name} has finalized their workplan for the week.`,
      action: '/management/workplans',
      creatorId: user.uid,
    });
    
    reset();
    onPlanCreated();
  };
  
  const formTitle = teamPlan ? "Step 2: Add Your Role-Specific Tasks" : "Create Your Weekly Plan";
  const formDescription = teamPlan ? "Add your personal tasks that contribute to the team priorities for this week." : "Since there's no team-wide plan published yet, define your own key priorities for the week.";

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-black tracking-tighter text-omuto-navy uppercase">{formTitle}</h3>
        <p className="text-sm font-bold text-omuto-navy/40">{formDescription}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              {...register(`individualTasks.${index}.value`)}
              placeholder={`Your Priority Task #${index + 1}`}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.individualTasks?.root && (
          <p className="text-sm text-destructive">{errors.individualTasks.root.message}</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })} className="h-10 border-lg rounded-xl font-bold">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <Button type="submit" disabled={isSubmitting} className="btn-omuto h-10 px-6 rounded-xl shadow-comic-sm">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalize My Weekly Plan
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WorkplanPage() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [teamPlan, setTeamPlan] = useState<TeamWeeklyPlan | null>(null);
  const [userPlan, setUserPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const { user } = useUser();
  const firestore = useFirestore();

  const weekStartDate = currentDate ? startOfWeek(currentDate, { weekStartsOn: 1 }) : new Date();
  const weekEndDate = currentDate ? endOfWeek(currentDate, { weekStartsOn: 1 }) : new Date();

  const priorityColors: { [key: string]: string } = {
    High: "border-rose-500 bg-rose-50 text-rose-700",
    Medium: "border-amber-500 bg-amber-50 text-amber-700",
    Low: "border-emerald-500 bg-emerald-50 text-emerald-700",
  };

  const fetchPlans = useCallback(async () => {
    if (!user || !firestore || !currentDate) return;
    setIsLoading(true);
    setTeamPlan(null);
    setUserPlan(null);

    const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    
    try {
      // First, check if the user has already submitted a plan for this week
      const userPlanQuery = query(
            collection(firestore, 'workplans'),
            where('userId', '==', user.uid),
            where('weekOf', '==', Timestamp.fromDate(startOfSelectedWeek)),
            limit(1)
        );
      const userPlanSnapshot = await getDocs(userPlanQuery);

      if (!userPlanSnapshot.empty) {
         const userDoc = userPlanSnapshot.docs[0];
         setUserPlan({ id: userDoc.id, ...userDoc.data() } as WeeklyWorkplan);
         setIsLoading(false);
         return; // Found user plan, no need to look for team plan for creation
      }

      // If no user plan, check for a published team plan
      const teamPlanQuery = query(
        collection(firestore, 'team-workplans'),
        where('weekOf', '==', Timestamp.fromDate(startOfSelectedWeek)),
        where('status', '==', 'Published'),
        limit(1)
      );
      const teamPlanSnapshot = await getDocs(teamPlanQuery);
      
      if (!teamPlanSnapshot.empty) {
        const teamPlanDoc = teamPlanSnapshot.docs[0];
        setTeamPlan({ id: teamPlanDoc.id, ...teamPlanDoc.data() } as TeamWeeklyPlan);
      } else {
        setTeamPlan(null);
      }

    } catch (e) {
      console.error("Error fetching workplans:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, currentDate]);


  useEffect(() => {
    if (currentDate) {
        fetchPlans();
    }
  }, [fetchPlans, currentDate]);

  const formatDeadline = (deadline: any) => {
    if (!deadline) return '-';
    let date;
    if (deadline.toDate) {
      date = deadline.toDate();
    } else {
      date = new Date(deadline);
    }
    return isValid(date) ? format(date, 'MMM dd') : String(deadline);
  };

  const renderContent = () => {
    if (isLoading || !currentDate) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      );
    }

    if (userPlan) {
      return (
        <div className="space-y-8">
            <Alert variant="default" className="bg-emerald-50 border-emerald-200 rounded-[1.5rem] p-5 shadow-sm">
                <AlertTitle className="font-black text-emerald-900 uppercase tracking-tight text-lg mb-1">Your Workplan is Submitted!</AlertTitle>
                <AlertDescription className="font-bold text-emerald-700 text-sm">
                   Your daily check-in form will now be populated based on this finalized plan. Go to the <Link href="/daily-plan" className="font-black underline decoration-2 underline-offset-4">AI Daily Planner</Link> to start your day.
                </AlertDescription>
            </Alert>
            {userPlan.teamPriorities && userPlan.teamPriorities.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-black text-lg text-omuto-navy uppercase tracking-tighter">Team Priorities</h3>
                    <div className="rounded-[1.5rem] border-lg border-omuto-navy/5 overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-omuto-cream/30">
                        <TableRow className="border-b-lg border-omuto-navy/5">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-omuto-navy/40">Activity</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-omuto-navy/40">Priority</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-omuto-navy/40">Responsible</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-omuto-navy/40">Deadline</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userPlan.teamPriorities.map((priority, index) => (
                            <TableRow key={index} className="border-b-lg border-omuto-navy/5 hover:bg-omuto-cream/5 transition-colors">
                                <TableCell className="font-bold text-omuto-navy text-sm py-4">{priority.activity}</TableCell>
                                <TableCell><Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-wider rounded-md", priorityColors[priority.priority])}>{priority.priority}</Badge></TableCell>
                                <TableCell className="font-bold text-omuto-navy/60 text-xs">{(Array.isArray(priority.responsible) ? priority.responsible.join(', ') : priority.responsible)}</TableCell>
                                <TableCell className="font-bold text-omuto-navy/60 text-xs">{formatDeadline(priority.deadline)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <h3 className="font-black text-lg text-omuto-navy uppercase tracking-tighter">My Individual Tasks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userPlan.individualTasks.map((task, index) => (
                        <div key={index} className="p-4 bg-card border-2 border-omuto-navy/5 rounded-2xl flex items-center gap-3 shadow-sm group hover:border-omuto-navy/15 transition-all">
                            <div className="w-8 h-8 rounded-full bg-omuto-navy/5 flex items-center justify-center text-omuto-navy/30 group-hover:bg-omuto-navy group-hover:text-white transition-all">
                                <span className="font-black text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-bold text-omuto-navy text-sm">{task}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
    }
    
    // This part is now the "Create" view, which is shown if userPlan is null
    if (teamPlan) { // A manager plan exists
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Review Team Priorities <Badge variant="secondary">{teamPlan.status}</Badge></h3>
                <p className="text-sm text-muted-foreground">These are the key objectives set by management for this week.</p>
                <Alert>
                    <AlertTitle className="font-bold">Message from {teamPlan.authorName}:</AlertTitle>
                    <AlertDescription className="italic">"{teamPlan.message}"</AlertDescription>
                </Alert>
                 <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Responsible</TableHead>
                        <TableHead>Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamPlan.keyPriorities.map((priority, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{priority.activity}</TableCell>
                            <TableCell><Badge variant="outline" className={priorityColors[priority.priority]}>{priority.priority}</Badge></TableCell>
                            <TableCell>{(Array.isArray(priority.responsible) ? priority.responsible.join(', ') : priority.responsible)}</TableCell>
                            <TableCell>{formatDeadline(priority.deadline)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                <FinalizeWorkplanForm teamPlan={teamPlan} onPlanCreated={fetchPlans} />
            </div>
        )
    }

    // Standalone creation view
    return (
        <div className="space-y-6">
            <Alert className="bg-amber-50 border-amber-200 rounded-[1.5rem] p-5">
                <AlertTitle className="font-black text-amber-900 uppercase tracking-tight mb-1">No Team Plan Published</AlertTitle>
                <AlertDescription className="font-bold text-amber-800/70 text-sm">A team-wide plan hasn't been published by management for this week yet. You can create your own standalone plan in the meantime.</AlertDescription>
            </Alert>
            <div className="bg-card border-lg border-omuto-navy/5 rounded-[2rem] p-8 shadow-sm">
                <FinalizeWorkplanForm teamPlan={null} onPlanCreated={fetchPlans} />
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="My Weekly Workplan" 
        description="Align your tasks with the team's weekly priorities set by management."
        icon={CalendarCheck}
        breadcrumbs={[
            { name: 'Ops Desk', href: '/management' },
            { name: 'Workplan', href: '/workplan' }
        ]}
      />
      
      {currentDate && (
        <Card className="rounded-[2.5rem] border-lg border-omuto-navy shadow-comic-sm bg-card overflow-hidden transition-all hover:shadow-comic">
            <CardHeader className="bg-omuto-cream/30 border-b-lg border-omuto-navy/5 pb-4 pt-7 px-8">
                <div className="flex justify-between items-center">
                    <CardTitle className="font-heading text-xl font-black tracking-tighter text-omuto-navy uppercase">
                        Week {getWeek(currentDate, { weekStartsOn: 1})}: {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
                    </CardTitle>
                    <div className="px-3 py-1 bg-omuto-red text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        Interactive
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {renderContent()}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
