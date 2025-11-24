'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Droplets } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

const padsDistributionSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  school: z.string().min(3, 'School/Community name is required.'),
  numberOfPads: z.coerce.number().min(1, 'Number of pads must be at least 1.'),
  girlsReached: z.coerce.number().min(1, 'Number of girls must be at least 1.'),
  notes: z.string().optional(),
});

type PadsDistributionFormData = z.infer<typeof padsDistributionSchema>;

export function PadsDistributionForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PadsDistributionFormData>({
    resolver: zodResolver(padsDistributionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: PadsDistributionFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const formData = {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'pads-distributions'), formData);
      toast({
        title: 'Distribution Logged!',
        description: `Distribution at ${data.school} has been recorded.`,
      });
      reset();
      router.push('/meal');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
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
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-6 w-6" />
            Pads Distribution Log
          </CardTitle>
          <CardDescription>
            Record the distribution of sanitary pads for the RED Campaign.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date of Distribution</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School/Community Name</Label>
                <Input id="school" {...register('school')} />
                {errors.school && <p className="text-sm text-destructive">{errors.school.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfPads">Number of Pads Distributed</Label>
                <Input id="numberOfPads" type="number" {...register('numberOfPads')} />
                {errors.numberOfPads && <p className="text-sm text-destructive">{errors.numberOfPads.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="girlsReached">Number of Girls Reached</Label>
                <Input id="girlsReached" type="number" {...register('girlsReached')} />
                {errors.girlsReached && <p className="text-sm text-destructive">{errors.girlsReached.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" {...register('notes')} placeholder="e.g., Coordinated with head teacher, distributed after MHM session..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Distribution Log
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
