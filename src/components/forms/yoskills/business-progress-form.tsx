'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BusinessIdea } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const progressSchema = z.object({
  businessIdeaId: z.string().min(1, 'Please select a business idea.'),
  month: z.string().min(1, 'Month is required.'),
  monthlySales: z.coerce.number().min(0, 'Sales must be zero or more.'),
  challenges: z.string().optional(),
  supportNeeded: z.string().optional(),
});

type ProgressFormData = z.infer<typeof progressSchema>;

export function BusinessProgressForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ideasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'business-ideas'), orderBy('businessName'));
  }, [firestore]);
  const { data: ideas, isLoading: isLoadingIdeas } = useCollection<BusinessIdea>(ideasQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      month: format(new Date(), 'yyyy-MM'),
      monthlySales: 0,
    }
  });

  const onSubmit = async (data: ProgressFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'business-progress'), formData);
      toast({
        title: 'Progress Logged!',
        description: `The monthly progress has been recorded.`,
      });
      reset();
      router.push('/meal/yoskills');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/yoskills">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to YoSkills Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Business Progress Tracking
          </CardTitle>
          <CardDescription>
            Log monthly progress for an active business from the YoSkills program.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessIdeaId">Business</Label>
              {isLoadingIdeas ? <Skeleton className="h-10" /> : (
                <Controller
                  name="businessIdeaId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="businessIdeaId"><SelectValue placeholder="Select a business..." /></SelectTrigger>
                      <SelectContent>
                        {ideas?.map(i => <SelectItem key={i.id} value={i.id}>{i.businessName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.businessIdeaId && <p className="text-sm text-destructive">{errors.businessIdeaId.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input id="month" type="month" {...register('month')} />
                {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlySales">Monthly Sales (UGX)</Label>
                <Input id="monthlySales" type="number" {...register('monthlySales')} />
                {errors.monthlySales && <p className="text-sm text-destructive">{errors.monthlySales.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Challenges Faced This Month (Optional)</Label>
              <Textarea id="challenges" {...register('challenges')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportNeeded">Support Needed (Optional)</Label>
              <Textarea id="supportNeeded" {...register('supportNeeded')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Progress Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
