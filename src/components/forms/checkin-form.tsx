'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import type { Checkout, Program } from '@/lib/types';


const checkinSchema = z.object({
  primaryMission: z.string().min(1, 'You must select a primary mission.'),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
  });

  const recentCheckoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: recentCheckouts } = useCollection<Checkout>(recentCheckoutQuery);

  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);

  const { data: programs } = useCollection<Program>(programsQuery);

  const allMissions = useMemo(() => {
    const dynamicMissions = [];
    if (recentCheckouts?.[0]?.tomorrowPlan) {
      dynamicMissions.push({
        id: 'mission-dynamic',
        label: `[FROM YESTERDAY] ${recentCheckouts[0].tomorrowPlan}`,
      });
    }

    const programMissions = programs?.map(p => ({
        id: p.id,
        label: `[PROGRAM] ${p.title}`
    })) || [];

    return [...dynamicMissions, ...programMissions, { id: 'mission-other', label: 'Other...' }];
  }, [recentCheckouts, programs]);

  useEffect(() => {
    if (recentCheckouts?.[0]?.tomorrowPlan) {
      setValue('primaryMission', `[FROM YESTERDAY] ${recentCheckouts[0].tomorrowPlan}`);
    }
  }, [recentCheckouts, setValue]);


  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit a check-in.",
        });
        return;
    }

    const checkinData = {
        ...data,
        userId: user.uid,
        name: user.displayName || user.email,
        timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({
      title: 'Checked In!',
      description: "Your daily mission has been logged. Let's make an impact!",
    });
    reset();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Plan Your Day for Maximum Impact</CardTitle>
          <CardDescription>
            Align your daily tasks with our strategic goals. This is the first
            step to a productive day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="primary-mission" className="text-base font-semibold">
              What's Your Primary Mission Today?
            </Label>
            <Controller
              name="primaryMission"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="primary-mission">
                    <SelectValue placeholder="Select a mission from the operational plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allMissions.map(mission => (
                        <SelectItem key={mission.id} value={mission.label}>{mission.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.primaryMission && (
              <p className="text-sm text-destructive">
                {errors.primaryMission.message}
              </p>
            )}
          </div>
          
          <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
             {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            Check In & Start Mission
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
