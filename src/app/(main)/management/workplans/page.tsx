
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, orderBy, limit, Timestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { TeamWeeklyPlan } from '@/lib/types';
import { getWeek, startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarClock, Loader2, Edit, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const teamWorkplanSchema = z.object({
  keyPriorities: z.array(z.object({ value: z.string().min(1, 'Priority cannot be empty.') })).min(1, 'At least one priority is required.'),
  message: z.string().min(5, "A brief message is required."),
  status: z.enum(['Draft', 'Published']),
});

type TeamWorkplanFormData = z.infer<typeof teamWorkplanSchema>;

function TeamWorkplanForm({
    weekOf,
    existingPlan,
    onPlanSaved,
  }: {
    weekOf: Date;
    existingPlan?: TeamWeeklyPlan | null;
    onPlanSaved: () => void;
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
  } = useForm<TeamWorkplanFormData>({
    resolver: zodResolver(teamWorkplanSchema),
    defaultValues: existingPlan
      ? {
          keyPriorities: existingPlan.keyPriorities.map(p => ({ value: p })),
          message: existingPlan.message,
          status: existingPlan.status,
        }
      : {
          keyPriorities: [{ value: '' }],
          message: '',
          status: 'Draft',
        },
  });

  useEffect(() => {
    reset(existingPlan
      ? {
          keyPriorities: existingPlan.keyPriorities.map(p => ({ value: p })),
          message: existingPlan.message,
          status: existingPlan.status,
        }
      : {
          keyPriorities: [{ value: '' }],
          message: '',
          status: 'Draft',
        });
  }, [existingPlan, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keyPriorities',
  });

  const onSubmit = async (data: TeamWorkplanFormData) => {
    if (!user || !profile || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    const weekStartDate = startOfWeek(weekOf, { weekStartsOn: 1 });

    const planData = {
        weekOf: Timestamp.fromDate(weekStartDate),
        keyPriorities: data.keyPriorities.map(p => p.value),
        message: data.message,
        authorId: user.uid,
        authorName: profile.name,
        status: data.status,
    }

    try {
        if(existingPlan) {
            const planRef = doc(firestore, 'team-workplans', existingPlan.id);
            await updateDocumentNonBlocking(planRef, planData);
            toast({ title: 'Plan Updated!', description: `The plan for the week has been updated.` });

        } else {
             await addDocumentNonBlocking(collection(firestore, 'team-workplans'), {
                ...planData,
                createdAt: Timestamp.now(),
            });
            toast({ title: 'Plan Saved!', description: `The team plan for the week has been saved as a ${data.status}.` });
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
             <CardDescription>Set the high-level priorities and message for the entire team for this week.</CardDescription>
        </CardHeader>
        <CardContent>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                    <Input {...register(`keyPriorities.${index}.value`)} placeholder={`Team Priority #${index + 1}`}/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                ))}
                {errors.keyPriorities?.root && <p className="text-sm text-destructive">{errors.keyPriorities.root.message}</p>}
                
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Priority
                </Button>

                <div className="space-y-2">
                    <Label htmlFor="message">Weekly Message/Focus</Label>
                    <Textarea id="message" {...register('message')} placeholder="e.g., 'This week is all about finalizing our Q3 reports and preparing for the partner visits...'" />
                    {errors.message && <p className="text-sm text-destructive">{`${errors.message.message}`}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                     <select {...register('status')} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                        <option value="Draft">Draft (Visible only to management)</option>
                        <option value="Published">Published (Visible to the whole team)</option>
                    </select>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingPlan ? 'Save Changes' : 'Save Team Plan'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}


export default function TeamWorkplansPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPlan, setCurrentPlan] = useState<TeamWeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();

  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const fetchTeamPlan = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
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
      setIsLoading(false);
    }
  }, [firestore, currentDate]);

  useEffect(() => {
    fetchTeamPlan();
  }, [fetchTeamPlan]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  
  // A manager should be able to do this. We're simplifying auth for now.
  const canEdit = true;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle>Team Weekly Plans</CardTitle>
                <CardDescription>
                Week {getWeek(currentDate)}: {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
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
             <TeamWorkplanForm weekOf={currentDate} existingPlan={currentPlan} onPlanSaved={fetchTeamPlan} />
          )}
        </CardContent>
      </Card>

      {currentPlan && (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Current Plan Summary
                    <Badge variant={currentPlan.status === 'Published' ? 'default' : 'secondary'}>{currentPlan.status}</Badge>
                </CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <Alert>
                    <AlertTitle>Message from {currentPlan.authorName}</AlertTitle>
                    <AlertDescription>"{currentPlan.message}"</AlertDescription>
                </Alert>
                 <div>
                    <h4 className="font-semibold mb-2">Key Priorities for the Week:</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {currentPlan.keyPriorities.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                 </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
