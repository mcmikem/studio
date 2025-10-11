
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import type { WeeklyWorkplan } from '@/lib/types';
import { getWeek, startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarCheck, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const workplanSchema = z.object({
  priorities: z.array(z.object({ value: z.string().min(1, 'Priority cannot be empty.') })).min(1, 'At least one priority is required.'),
});

type WorkplanFormData = z.infer<typeof workplanSchema>;

const getWeekId = (date: Date) => {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return format(monday, 'yyyy-MM-dd');
}

function NewWorkplanForm({ weekOf, onPlanCreated }: { weekOf: Date, onPlanCreated: () => void }) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<WorkplanFormData>({
    resolver: zodResolver(workplanSchema),
    defaultValues: {
      priorities: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'priorities',
  });

  const onSubmit = async (data: WorkplanFormData) => {
    if (!user || !profile || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const weekStartDate = startOfWeek(weekOf, { weekStartsOn: 1 });

    const newPlan: Omit<WeeklyWorkplan, 'id'> = {
      userId: user.uid,
      userName: profile.name,
      weekOf: Timestamp.fromDate(weekStartDate),
      keyPriorities: data.priorities.map(p => p.value),
      createdAt: Timestamp.now(),
    };

    const workplansCollection = collection(firestore, 'workplans');
    await addDocumentNonBlocking(workplansCollection, newPlan);

    toast({
      title: 'Workplan Saved!',
      description: `Your plan for the week of ${format(weekStartDate, 'MMM do')} has been saved.`,
    });
    reset();
    onPlanCreated();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            {...register(`priorities.${index}.value`)}
            placeholder={`Priority #${index + 1}`}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
       {errors.priorities?.root && (
        <p className="text-sm text-destructive">{errors.priorities.root.message}</p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Priority
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Weekly Plan
        </Button>
      </div>
    </form>
  );
}


export default function WorkplanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPlan, setCurrentPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useUser();
  const firestore = useFirestore();
  
  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const fetchWorkplan = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    
    const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const start = Timestamp.fromDate(startOfSelectedWeek);

    const q = query(
      collection(firestore, 'workplans'),
      where('userId', '==', user.uid),
      where('weekOf', '==', start),
      limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setCurrentPlan({ id: doc.id, ...doc.data() } as WeeklyWorkplan);
        } else {
            setCurrentPlan(null);
        }
    } catch(e) {
        console.error("Error fetching workplan:", e);
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore, currentDate]);

  useEffect(() => {
    fetchWorkplan();
  }, [fetchWorkplan]);


  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-8 w-8" />
          My Weekly Workplan
        </h1>
        <p className="text-muted-foreground">
          Set your strategic priorities for the week. Your daily check-ins will be based on this plan.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
                Week {getWeek(currentDate)}: {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
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
          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-8 w-full" />
             </div>
          ) : currentPlan ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Your Key Priorities for this Week:</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                {currentPlan.keyPriorities.map((priority, index) => (
                  <li key={index} className="text-md">{priority}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground pt-4">Your daily check-in form will now be populated with these priorities.</p>
            </div>
          ) : (
            <div>
                <CardDescription className="mb-4">You haven't created a workplan for this week yet. Set your key priorities below.</CardDescription>
                <NewWorkplanForm weekOf={currentDate} onPlanCreated={fetchWorkplan} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
