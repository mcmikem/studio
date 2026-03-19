'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, Sprout, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.object({
  sourceActivityId: z.string().optional(),
  schoolName: z.string().min(2, 'School name is required.'),
  surveyDate: z.string().min(1, 'Date is required.'),
  numberOfTreesSurvived: z.coerce.number().min(0),
  totalTreesAtPlanting: z.coerce.number().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type PlantingActivity = { id: string; title?: string; trees_planted?: number };
type EnvironmentalClub = { id: string; schoolName?: string };

export function TreeSurveyForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'));
  }, [firestore]);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'environmental-clubs'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: activities, isLoading: activitiesLoading } = useCollection<PlantingActivity>(activitiesQuery);
  const { data: clubs } = useCollection<EnvironmentalClub>(schoolsQuery);

  const schoolOptions = useMemo(() => {
    const names = new Set<string>();
    clubs?.forEach((c) => c.schoolName && names.add(c.schoolName));
    return Array.from(names).sort();
  }, [clubs]);

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { surveyDate: format(new Date(), 'yyyy-MM-dd'), totalTreesAtPlanting: 1, numberOfTreesSurvived: 0 },
  });

  const survived = watch('numberOfTreesSurvived') || 0;
  const planted = watch('totalTreesAtPlanting') || 1;
  const survivalRate = Math.max(0, Math.min(100, (survived / planted) * 100));

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    try {
      await addDocumentNonBlocking(collection(firestore, 'tree-surveys'), {
        ...data,
        survivalRate: Number(survivalRate.toFixed(2)),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Survey Submitted', description: 'Tree survival data has been recorded.' });
      reset({ surveyDate: format(new Date(), 'yyyy-MM-dd'), totalTreesAtPlanting: 1, numberOfTreesSurvived: 0 });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild><Link href="/meal/greenschools"><ArrowLeft className="mr-2 h-4 w-4" />Back to Green Schools</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sprout className="h-6 w-6" />Tree Survival Survey</CardTitle>
          <CardDescription>Follow-up survey for tree planting activities with auto survival-rate calculation.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label>Related Planting Activity (optional)</Label>
              {activitiesLoading ? <Skeleton className="h-10 sm:h-11 w-full" /> : (
                <Controller name="sourceActivityId" control={control} render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const activity = activities?.find((a) => a.id === value);
                      if (activity?.trees_planted) setValue('totalTreesAtPlanting', activity.trees_planted);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="h-10 sm:h-11"><SelectValue placeholder="Select activity" /></SelectTrigger>
                    <SelectContent>
                      {activities?.filter((a) => (a.trees_planted || 0) > 0).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.title || 'Activity'} ({a.trees_planted} trees)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" list="school-options" {...register('schoolName')} className="h-10 sm:h-11" placeholder="Start typing to use suggestions" />
                <datalist id="school-options">{schoolOptions.map((name) => <option key={name} value={name} />)}</datalist>
                {errors.schoolName && <p className="text-xs sm:text-sm text-destructive">{errors.schoolName.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="surveyDate">Survey Date</Label><Input id="surveyDate" type="date" {...register('surveyDate')} className="h-10 sm:h-11" /></div>
              <div className="space-y-2"><Label htmlFor="totalTreesAtPlanting">Trees Planted Initially</Label><Input id="totalTreesAtPlanting" type="number" {...register('totalTreesAtPlanting')} className="h-10 sm:h-11" /></div>
              <div className="space-y-2"><Label htmlFor="numberOfTreesSurvived">Trees Survived</Label><Input id="numberOfTreesSurvived" type="number" {...register('numberOfTreesSurvived')} className="h-10 sm:h-11" /></div>
            </div>

            <div className="rounded-lg border p-3 bg-muted/40 text-sm">Current survival rate: <span className="font-bold">{survivalRate.toFixed(1)}%</span></div>

            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} placeholder="Observed challenges, weather conditions, maintenance actions..." className="min-h-[80px] sm:min-h-[100px]" /></div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6"><Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Survey</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
