
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { YAP_Chapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const reportSchema = z.object({
  chapterId: z.string().min(1, "Please select a chapter."),
  month: z.string().min(1, 'Month is required.'),
  activities: z.string().min(10, 'Please describe the activities held.'),
  attendance: z.coerce.number().min(0, 'Attendance must be zero or more.'),
  outcomes: z.string().min(10, 'Please describe the outcomes.'),
  challenges: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export function MonthlyReportForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const chaptersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'yap-chapters'), orderBy('chapterName'));
  }, [firestore]);
  const { data: chapters, isLoading } = useCollection<YAP_Chapter>(chaptersQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      month: format(new Date(), 'yyyy-MM'),
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'yap-reports'), formData);
      toast({
        title: 'Report Submitted!',
        description: `The monthly report for ${data.month} has been recorded.`,
      });
      reset();
      router.push('/meal/yap');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/yap">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to YAP Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            YAP Monthly Report
          </CardTitle>
          <CardDescription>
            Log monthly activities, outcomes, and challenges for a chapter.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="chapterId">Chapter</Label>
                     {isLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Controller
                            name="chapterId"
                            control={control}
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="chapterId"><SelectValue placeholder="Select a chapter..." /></SelectTrigger>
                                <SelectContent>{chapters?.map(c => <SelectItem key={c.id} value={c.id}>{c.chapterName}</SelectItem>)}</SelectContent>
                            </Select>
                            )}
                        />
                    )}
                    {errors.chapterId && <p className="text-sm text-destructive">{errors.chapterId.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="month">Report Month</Label>
                    <Input id="month" type="month" {...register('month')} />
                    {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activities">Activities This Month</Label>
              <Textarea id="activities" {...register('activities')} />
              {errors.activities && <p className="text-sm text-destructive">{errors.activities.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance">Average Session Attendance</Label>
              <Input id="attendance" type="number" {...register('attendance')} />
              {errors.attendance && <p className="text-sm text-destructive">{errors.attendance.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="outcomes">Outcomes & Successes</Label>
              <Textarea id="outcomes" {...register('outcomes')} />
              {errors.outcomes && <p className="text-sm text-destructive">{errors.outcomes.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="challenges">Challenges Faced (Optional)</Label>
              <Textarea id="challenges" {...register('challenges')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Monthly Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
