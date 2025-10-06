'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { Label } from '../ui/label';

const checkinSchema = z.object({
  primaryMission: z.string().min(1, 'Please select a primary mission.'),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function NewCheckinForm() {
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
  
  const missionFromYesterday = recentCheckouts?.[0]?.tomorrowPlan;

  useMemo(() => {
    if (missionFromYesterday) {
      setValue('primaryMission', missionFromYesterday);
    }
  }, [missionFromYesterday, setValue]);


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
      description: "Your daily mission has been logged.",
    });
    reset({ primaryMission: '' });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="primary-mission">What's Your Primary Mission Today?</Label>
             <Controller
              name="primaryMission"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="primary-mission">
                    <SelectValue placeholder="Select or type your mission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {missionFromYesterday && <SelectItem value={missionFromYesterday}>{missionFromYesterday}</SelectItem>}
                    <SelectItem value="Fundraising & Partnerships">Fundraising & Partnerships</SelectItem>
                    <SelectItem value="Program Development">Program Development</SelectItem>
                    <SelectItem value="Field Operations">Field Operations</SelectItem>
                     <SelectItem value="Media & Comms">Media & Comms</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.primaryMission && <p className="text-sm text-destructive">{errors.primaryMission.message}</p>}
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
             {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Check In
          </Button>
    </form>
  )
}
