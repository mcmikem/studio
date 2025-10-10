'use client';
import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  useCollection,
} from '@/firebase';
import { collection, serverTimestamp, query, where, limit, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import type { Checkout, WeeklyWorkplan, KeyResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, LogIn } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfWeek } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';

const checkinSchema = z.object({
  primaryMission: z.string().min(10, 'Please provide a clear mission for the day.'),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const [isLoadingContext, setIsLoadingContext] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
  });

  const fetchContext = useCallback(async () => {
    if (!firestore || !user) {
        setIsLoadingContext(false);
        return;
    };
    setIsLoadingContext(true);

    const today = new Date();
    const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });

    const workplanQuery = query(
      collection(firestore, 'workplans'),
      where('userId', '==', user.uid),
      where('weekOf', '==', Timestamp.fromDate(weekStartDate)),
      limit(1)
    );

    const workplanSnapshot = await getDocs(workplanQuery);
    if (!workplanSnapshot.empty) {
      const plan = workplanSnapshot.docs[0].data() as WeeklyWorkplan;
      setValue('primaryMission', `My priorities this week are: ${plan.keyPriorities.join(', ')}. Today I will focus on...`);
      setIsLoadingContext(false);
      return;
    }

    const checkoutQuery = query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const checkoutSnapshot = await getDocs(checkoutQuery);
    if (!checkoutSnapshot.empty) {
      const lastCheckout = checkoutSnapshot.docs[0].data() as Checkout;
      if (lastCheckout.tomorrowPlan) {
        setValue('primaryMission', lastCheckout.tomorrowPlan);
      }
    }
    setIsLoadingContext(false);
  }, [firestore, user, setValue]);


  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const onSubmit = async (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }

    const checkinData = {
      primaryMission: data.primaryMission,
      details: {}, // Keep details empty as we removed the complex form
      userId: user.uid,
      name: profile.name,
      timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    await addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({
      title: 'Daily Plan Submitted!',
      description: 'Your mission for the day is logged.',
    });
    setValue('primaryMission', '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>
          What is your single most important mission for today? This should align with your weekly priorities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="primaryMission" className="sr-only">Primary Mission</Label>
             {isLoadingContext ? <Skeleton className="w-full h-24" /> : (
                <Textarea
                    id="primaryMission"
                    {...register('primaryMission')}
                    placeholder="e.g., Finalize the RED Campaign report and submit to GlobalGiving."
                    className="min-h-[120px]"
                />
             )}
            {errors.primaryMission && <p className="text-sm text-destructive mt-2">{errors.primaryMission.message}</p>}
          </div>
           <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<LogIn className="mr-2 h-5 w-5" />)}
            Check In & Start My Day
          </Button>
        </form>
         <Alert variant="default" className="mt-6">
            <AlertTitle>No Weekly Plan?</AlertTitle>
            <AlertDescription>
                <p>For more effective planning, set your priorities for the week. Your daily check-in will automatically start with them.</p>
                <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href="/workplan">Set Your Weekly Workplan</Link>
                </Button>
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
