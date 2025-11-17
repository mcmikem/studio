
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useUser, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import type { WeeklyWorkplan, TeamWeeklyPlan } from '@/lib/types';
import { getWeek, startOfWeek, endOfWeek, format, addWeeks, subWeeks, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarCheck, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createAlert } from '@/ai/flows/create-alert-flow';

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
  teamPlan: TeamWeeklyPlan;
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

    const newPlan: Omit<WeeklyWorkplan, 'id'> = {
      userId: user.uid,
      userName: profile.name,
      weekOf: teamPlan.weekOf,
      teamPlanId: teamPlan.id,
      teamPriorities: teamPlan.keyPriorities,
      individualTasks: data.individualTasks.map(t => t.value),
      createdAt: Timestamp.now(),
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

  return (
    <div className="mt-6 space-y-4">
      <Separator />
      <h3 className="text-lg font-semibold">Step 2: Add Your Role-Specific Tasks</h3>
      <p className="text-sm text-muted-foreground">Add your personal tasks that contribute to the team priorities for this week.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              {...register(`individualTasks.${index}.value`)}
              placeholder={`Your Task #${index + 1}`}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.individualTasks?.root && (
          <p className="text-sm text-destructive">{errors.individualTasks.root.message}</p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalize My Weekly Plan
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WorkplanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [teamPlan, setTeamPlan] = useState<TeamWeeklyPlan | null>(null);
  const [userPlan, setUserPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useUser();
  const firestore = useFirestore();

  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const priorityColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
  };

  const fetchPlans = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    setTeamPlan(null);
    setUserPlan(null);

    const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    
    try {
      const teamPlanQuery = query(
        collection(firestore, 'team-workplans'),
        where('weekOf', '==', Timestamp.fromDate(startOfSelectedWeek)),
        where('status', '==', 'Published'),
        limit(1)
      );
      const teamPlanSnapshot = await getDocs(teamPlanQuery);
      
      if (!teamPlanSnapshot.empty) {
        const teamPlanDoc = teamPlanSnapshot.docs[0];
        const fetchedTeamPlan = { id: teamPlanDoc.id, ...teamPlanDoc.data() } as TeamWeeklyPlan;
        setTeamPlan(fetchedTeamPlan);

        const userPlanQuery = query(
            collection(firestore, 'workplans'),
            where('userId', '==', user.uid),
            where('teamPlanId', '==', fetchedTeamPlan.id),
            limit(1)
        );
        const userPlanSnapshot = await getDocs(userPlanQuery);
        if (!userPlanSnapshot.empty) {
            const userDoc = userPlanSnapshot.docs[0];
            setUserPlan({ id: userDoc.id, ...userDoc.data() } as WeeklyWorkplan);
        } else {
            setUserPlan(null);
        }
      } else {
        setTeamPlan(null);
        setUserPlan(null);
      }

    } catch (e) {
      console.error("Error fetching workplans:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, currentDate]);


  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  
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
    if (isLoading) {
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
        <div className="space-y-6">
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <AlertTitle className="font-bold text-green-800 dark:text-green-300">Your Workplan is Submitted!</AlertTitle>
                <AlertDescription>
                   Your daily check-in form will now be populated based on this finalized plan. Go to the <Link href="/daily-plan" className="font-bold underline">AI Daily Planner</Link> to start your day.
                </AlertDescription>
            </Alert>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Team Priorities</h3>
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
                        {userPlan.teamPriorities.map((priority, index) => (
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
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">My Individual Tasks</h3>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    {userPlan.individualTasks.map((task, index) => (
                    <li key={index} className="font-medium">{task}</li>
                    ))}
                </ul>
            </div>
        </div>
      );
    }
    
    if (teamPlan) {
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

    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          A team workplan has not been published by management for this week yet.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-8 w-8" />
          My Weekly Workplan
        </h1>
        <p className="text-muted-foreground">
          Align your tasks with the team's weekly priorities set by management.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Week {getWeek(currentDate, { weekStartsOn: 1})}: {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
            </CardTitle>
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
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
