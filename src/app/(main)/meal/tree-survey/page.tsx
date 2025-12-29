
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, Timestamp, query, orderBy, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Leaf, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Suspense } from 'react';
import Link from 'next/link';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/lib/types';
import { formatDateSafe } from '@/lib/utils';

const treeSurveySchema = z.object({
  originalPlantingActivityId: z.string().min(1, 'Please select the original planting activity.'),
  surveyDate: z.string().min(1, "Date of survey is required."),
  numberOfTreesSurvived: z.coerce.number().min(0, "Number of trees must be 0 or more."),
  conditionOfTrees: z.enum(["Good", "Fair", "Poor"]),
  notes: z.string().optional(),
});

type SurveyFormData = z.infer<typeof treeSurveySchema>;

function TreeSurveyFormComponent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const plantingActivitiesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
          collection(firestore, 'activities'),
          where('trees_planted', '>', 0),
          orderBy('trees_planted', 'desc')
      );
  }, [firestore]);
  
  const { data: plantingActivities, isLoading } = useCollection<Activity>(plantingActivitiesQuery);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<SurveyFormData>({
    resolver: zodResolver(treeSurveySchema),
    defaultValues: {
        surveyDate: format(new Date(), 'yyyy-MM-dd'),
        conditionOfTrees: 'Good',
    }
  });


  const onSubmit = async (data: SurveyFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a report.' });
      return;
    }

    const surveyData = {
      ...data,
      userId: user.uid,
      userName: profile.name,
      createdAt: serverTimestamp() as Timestamp,
    };
    
    await addDocumentNonBlocking(collection(firestore, 'tree-surveys'), surveyData)
        .then(() => {
            toast({ title: "Survey Submitted!", description: "The tree survival data has been logged." });
            router.push('/meal');
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the survey.' });
        });
  };

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href="/meal">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to MEAL Hub
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Leaf className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>GreenSchools Tree Survival Survey</CardTitle>
                        <CardDescription>Log follow-up data on a previous tree planting activity.</CardDescription>
                    </div>
                </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="originalPlantingActivityId">Original Planting Activity</Label>
                    {isLoading ? <Skeleton className="h-10" /> : (
                    <Controller
                        name="originalPlantingActivityId"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select the planting activity..." /></SelectTrigger>
                            <SelectContent>
                                {plantingActivities?.map(act => (
                                    <SelectItem key={act.id} value={act.id}>
                                        {act.title} ({formatDateSafe(act.loggedAt, 'dateOnly')})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    )}
                    {errors.originalPlantingActivityId && <p className="text-sm text-destructive">{errors.originalPlantingActivityId.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="numberOfTreesSurvived">Number of Trees Survived</Label>
                        <Input id="numberOfTreesSurvived" type="number" {...register('numberOfTreesSurvived')} placeholder="e.g., 120" />
                        {errors.numberOfTreesSurvived && <p className="text-sm text-destructive">{errors.numberOfTreesSurvived.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="surveyDate">Date of Survey</Label>
                        <Input id="surveyDate" type="date" {...register('surveyDate')} />
                        {errors.surveyDate && <p className="text-sm text-destructive">{errors.surveyDate.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="conditionOfTrees">General Condition of Trees</Label>
                    <Controller
                        name="conditionOfTrees"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select condition..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Good">Good (Healthy and growing well)</SelectItem>
                                <SelectItem value="Fair">Fair (Some signs of stress, but alive)</SelectItem>
                                <SelectItem value="Poor">Poor (Unhealthy, unlikely to survive)</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Observations</Label>
                    <Textarea id="notes" {...register('notes')} placeholder="e.g., Some trees affected by drought, others are thriving. Local community has been watering them..." className="min-h-[100px]" />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Survey Data
                </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}

export default function TreeSurveyPage() {
    return (
        <Suspense>
            <TreeSurveyFormComponent />
        </Suspense>
    )
}
