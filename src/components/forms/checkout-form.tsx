'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut, Send, Wand } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import type { Checkin } from '@/lib/types';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';

const checkoutSchema = z.object({
  missionAccomplished: z
    .string()
    .min(10, 'Please provide a meaningful summary.'),
  parentsReached: z.coerce.number().optional(),
  volunteersRecruited: z.coerce.number().optional(),
  prototypesTested: z.coerce.number().optional(),
  learning: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  photo: z.any().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [submittedCheckoutId, setSubmittedCheckoutId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      parentsReached: 0,
      volunteersRecruited: 0,
      prototypesTested: 0,
    },
  });

  const startOfDay = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(now);
  }, []);

  const recentCheckinQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', startOfDay),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, user, startOfDay]);

  const { data: recentCheckins, isLoading: isLoadingCheckin } =
    useCollection<Checkin>(recentCheckinQuery);
  
  const missionFromCheckin = recentCheckins?.[0]?.primaryMission;

  useEffect(() => {
    if (missionFromCheckin) {
      setValue('missionAccomplished', `Progress on: ${missionFromCheckin}. `);
    }
  }, [missionFromCheckin, setValue]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!firestore || !user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a report.',
      });
      return;
    }

    const impactNumbers = [
      data.parentsReached && `Parents Reached: ${data.parentsReached}`,
      data.volunteersRecruited &&
        `Volunteers Recruited: ${data.volunteersRecruited}`,
      data.prototypesTested &&
        `Prototypes Tested: ${data.prototypesTested}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const fullTask = `${data.missionAccomplished} #Update ${
      impactNumbers ? `| ${impactNumbers}` : ''
    }`;

    const checkoutData = {
      name: profile.name,
      role: profile.role,
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      task: fullTask,
      learning: data.learning || "",
      tomorrowPlan: data.tomorrowPlan || "",
      timestamp: serverTimestamp(),
      userId: user.uid,
    };

    const checkoutsCollection = collection(firestore, 'checkouts');
    try {
        const docRef = await addDoc(checkoutsCollection, checkoutData);
        if (docRef?.id) {
          setSubmittedCheckoutId(docRef.id);
        }
        toast({
        title: 'Check-out Submitted!',
        description: 'Your impact report has been saved.',
        });
    } catch (e) {
        console.error("Failed to submit checkout", e)
         toast({
            variant: "destructive",
            title: "Submission Error",
            description: "Could not save your checkout report. Please try again.",
        });
    }
  };
  
  if (submittedCheckoutId) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Report Submitted Successfully!</CardTitle>
                <CardDescription>What would you like to do next?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => {
                    reset({
                        missionAccomplished: '',
                        learning: '',
                        tomorrowPlan: '',
                        parentsReached: 0,
                        volunteersRecruited: 0,
                        prototypesTested: 0,
                    });
                    setSubmittedCheckoutId(null);
                }}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit another report
                </Button>
                 <Button asChild>
                    <Link href={`/impact-story?checkoutId=${submittedCheckoutId}`}>
                        <Wand className="mr-2 h-4 w-4" />
                        Generate Impact Story
                    </Link>
                </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">You can generate a compelling story for social media based on the report you just submitted.</p>
            </CardFooter>
        </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="space-y-4">
          <Label
            htmlFor="mission-accomplished"
            className="text-base font-semibold"
          >
            Section 1: Mission Accomplishment
          </Label>
          <Textarea
            id="mission-accomplished"
            placeholder={
              isLoadingCheckin
                ? "Loading today's mission..."
                : 'What did you achieve?'
            }
            className="min-h-[100px]"
            {...register('missionAccomplished')}
          />
          {errors.missionAccomplished && (
            <p className="text-sm text-destructive">
              {`${errors.missionAccomplished.message}`}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact-parents">Parents Reached</Label>
              <Input
                id="impact-parents"
                type="number"
                placeholder="e.g., 35"
                {...register('parentsReached')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact-volunteers">Volunteers Recruited</Label>
              <Input
                id="impact-volunteers"
                type="number"
                placeholder="e.g., 3"
                {...register('volunteersRecruited')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact-prototypes">Prototypes Tested</Label>
              <Input
                id="impact-prototypes"
                type="number"
                placeholder="e.g., 5"
                {...register('prototypesTested')}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Section 2: Evidence & Documentation
          </Label>
          <div className="space-y-2">
            <Label htmlFor="photo">Attach Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              {...register('photo')}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Photos will be automatically tagged with activity and location.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label htmlFor="learning" className="text-base font-semibold">
            Section 3: Learning & Adaptation
          </Label>
          <Textarea
            id="learning"
            placeholder="What should we do differently next time?"
            className="min-h-[80px]"
            {...register('learning')}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <Label htmlFor="tomorrow-plan" className="text-base font-semibold">
            Section 4: Plan Tomorrow's Win
          </Label>
          <Input
            id="tomorrow-plan"
            placeholder="Tomorrow's priority will be..."
            {...register('tomorrowPlan')}
          />
        </div>
        <Button
            size="lg"
            className="w-full"
            type="submit"
            disabled={isSubmitting}
        >
            {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
            <LogOut className="mr-2 h-5 w-5" />
            )}
            Check Out & Submit Report
        </Button>
      </div>
    </form>
  );
}
