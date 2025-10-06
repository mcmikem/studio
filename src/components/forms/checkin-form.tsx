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
import { Textarea } from '../ui/textarea';
import { useUserProfile } from '@/hooks/use-user-profile';


const checkinSchema = z.object({
  primaryMission: z.string().min(1, 'You must select a primary mission.'),
  missionDetails: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    register
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
  });

  const selectedMission = watch('primaryMission');

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
    const missionSet = new Set<string>();

    if (recentCheckouts?.[0]?.tomorrowPlan) {
      missionSet.add(`[FROM YESTERDAY] ${recentCheckouts[0].tomorrowPlan}`);
    }

    programs?.forEach(p => {
        missionSet.add(`[PROGRAM] ${p.title}`);
    });

    missionSet.add('Other...');

    return Array.from(missionSet).map(label => ({ id: label, label }));
  }, [recentCheckouts, programs]);

  useEffect(() => {
    if (recentCheckouts?.[0]?.tomorrowPlan) {
      setValue('primaryMission', `[FROM YESTERDAY] ${recentCheckouts[0].tomorrowPlan}`);
    }
  }, [recentCheckouts, setValue]);


  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit a check-in.",
        });
        return;
    }
    
    let mission = data.primaryMission;
    if (mission === "Other..." && data.missionDetails) {
        mission = data.missionDetails;
    }

    const checkinData = {
        primaryMission: mission,
        userId: user.uid,
        name: profile.name,
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
             {selectedMission === 'Other...' && (
              <div className="space-y-2">
                <Label htmlFor="mission-details">Please specify your mission</Label>
                <Textarea
                  id="mission-details"
                  placeholder="e.g., Follow up with potential partners for the RED Campaign."
                  {...register('missionDetails')}
                />
              </div>
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
