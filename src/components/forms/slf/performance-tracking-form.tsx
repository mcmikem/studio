
'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, BarChart, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { SLF_Prefect } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const performanceSchema = z.object({
  prefectId: z.string().min(1, "Please select a prefect."),
  month: z.string().min(1, 'Month is required.'),
  visibilityScore: z.number().min(1).max(5),
  disciplineScore: z.number().min(1).max(5),
  initiativeScore: z.number().min(1).max(5),
  teacherComments: z.string().optional(),
});

type PerformanceFormData = z.infer<typeof performanceSchema>;

function StarRating({ name, label, control }: { name: "visibilityScore" | "disciplineScore" | "initiativeScore", label: string, control: any }) {
    
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star
                                key={star}
                                className={`cursor-pointer h-8 w-8 transition-colors ${field.value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                                onClick={() => field.onChange(star)}
                            />
                        ))}
                    </div>
                )}
            />
        </div>
    )
}

export function PerformanceTrackingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const prefectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'slf-prefects'), orderBy('name'));
  }, [firestore]);

  const { data: prefects, isLoading: isLoadingPrefects } = useCollection<SLF_Prefect>(prefectsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PerformanceFormData>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      month: format(new Date(), 'yyyy-MM'),
      visibilityScore: 3,
      disciplineScore: 3,
      initiativeScore: 3,
    },
  });

  const onSubmit = async (data: PerformanceFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }
    
    const selectedPrefect = prefects?.find(p => p.id === data.prefectId);

    const formData = {
      ...data,
      prefectName: selectedPrefect?.name || 'Unknown Prefect',
      schoolId: selectedPrefect?.schoolId || 'Unknown School',
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'prefect-performance'), formData);
      toast({
        title: 'Performance Logged!',
        description: `The performance for ${selectedPrefect?.name} has been recorded for the month.`,
      });
      reset();
      router.push('/meal/slf');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/slf">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to SLF Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Prefect Performance Tracking
          </CardTitle>
          <CardDescription>
            Track the monthly performance of a student leader.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefectId">Select Prefect</Label>
                {isLoadingPrefects ? <Skeleton className="h-10 w-full" /> : (
                <Controller
                    name="prefectId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="prefectId"><SelectValue placeholder="Select a prefect..." /></SelectTrigger>
                        <SelectContent>
                            {prefects?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.schoolName})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                )}
                {errors.prefectId && <p className="text-sm text-destructive">{errors.prefectId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input id="month" type="month" {...register('month')} />
                {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StarRating name="visibilityScore" label="Visibility Score" control={control} />
                <StarRating name="disciplineScore" label="Discipline Score" control={control} />
                <StarRating name="initiativeScore" label="Initiative Score" control={control} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherComments">Teacher/Patron Comments (Optional)</Label>
              <Textarea id="teacherComments" {...register('teacherComments')} placeholder="e.g., Showed great leadership during the assembly..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Performance Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

      