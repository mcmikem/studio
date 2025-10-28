
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
import { Loader2, LogOut } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Checkin } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

const checkoutTaskSchema = z.object({
  description: z.string(),
  status: z.enum(['Done', 'Not Done']),
  reason: z.string().optional(),
});

const checkoutSchema = z.object({
  tasks: z.array(checkoutTaskSchema).min(1, 'Please review your tasks.'),
  learning: z.string().optional(),
  tomorrowPlan: z.string().min(5, "Please set a priority for tomorrow.").optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const router = useRouter();
  
  const [dailyCheckin, setDailyCheckin] = useState<Checkin | null>(null);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(true);

  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      tasks: [],
      learning: '',
      tomorrowPlan: '',
    },
  });
  
  const { fields } = useFieldArray({
    control,
    name: "tasks",
  });

  const fetchCheckin = useCallback(async () => {
    if (!user || !firestore) {
      setIsLoadingCheckin(false);
      return;
    }
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const q = query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(todayStart)),
      where('timestamp', '<=', Timestamp.fromDate(todayEnd)),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const checkinData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Checkin;
        setDailyCheckin(checkinData);
        
        // Populate the form with tasks from the check-in
        const tasksFromCheckin = checkinData.details.timeBlocks.map(block => ({
            description: block.description,
            status: 'Done' as 'Done' | 'Not Done',
            reason: '',
        }));
        reset({ tasks: tasksFromCheckin, learning: '', tomorrowPlan: '' });

      } else {
        setDailyCheckin(null);
      }
    } catch (e) {
      console.error("Error fetching check-in:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load your daily plan.' });
    } finally {
      setIsLoadingCheckin(false);
    }
  }, [user, firestore, reset, toast]);

  useEffect(() => {
    fetchCheckin();
  }, [fetchCheckin]);


  const onSubmit = (data: CheckoutFormData) => {
    if (!firestore || !user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a report.',
      });
      return;
    }

    const checkoutData = {
      name: profile.name,
      role: profile.role,
      avatar: user.photoURL || '',
      tasks: data.tasks,
      learning: data.learning || "",
      tomorrowPlan: data.tomorrowPlan || "",
      timestamp: serverTimestamp(),
      userId: user.uid,
    };

    const checkoutsCollection = collection(firestore, 'checkouts');
    
    addDocumentNonBlocking(checkoutsCollection, checkoutData)
      .then((docRef) => {
        toast({
          title: 'Check-out Submitted!',
          description: 'Your impact report has been saved to the Team Stream.',
        });
        reset();
        router.push('/stream');
      })
      .catch((e: any) => {
        console.error("Failed to submit checkout", e)
      });
  };
  
  if (isLoadingCheckin) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      )
  }

  if (!dailyCheckin) {
      return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Check-in Found</AlertTitle>
            <AlertDescription>
                You must have a check-in for today to submit a checkout report. Please complete your daily plan first.
            </AlertDescription>
         </Alert>
      )
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div>
            <Label className="text-base font-semibold">
                Review Today's Planned Tasks
            </Label>
            <p className="text-sm text-muted-foreground mb-4">Mark each task from your daily plan as 'Done' or 'Not Done'.</p>

            <div className="space-y-4">
                {fields.map((field, index) => {
                    const taskStatus = watch(`tasks.${index}.status`);
                    return (
                        <Card key={field.id} className="p-4">
                             <p className="font-medium mb-2">{field.description}</p>
                            <Controller
                                control={control}
                                name={`tasks.${index}.status`}
                                render={({ field: controllerField }) => (
                                    <RadioGroup
                                    onValueChange={controllerField.onChange}
                                    defaultValue={controllerField.value}
                                    className="flex gap-4"
                                    >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Done" id={`done-${index}`} />
                                        <Label htmlFor={`done-${index}`}>Done</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Not Done" id={`not-done-${index}`} />
                                        <Label htmlFor={`not-done-${index}`}>Not Done</Label>
                                    </div>
                                    </RadioGroup>
                                )}
                            />
                            {taskStatus === 'Not Done' && (
                                <div className="mt-2 space-y-1">
                                    <Label htmlFor={`reason-${index}`} className="text-xs">Reason (optional)</Label>
                                     <Textarea
                                        id={`reason-${index}`}
                                        placeholder="e.g., Ran out of time, waiting for partner feedback..."
                                        className="min-h-[60px]"
                                        {...register(`tasks.${index}.reason`)}
                                    />
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
             {errors.tasks && (
                <p className="text-sm text-destructive mt-2">
                    {`${errors.tasks.message}`}
                </p>
            )}
        </div>


        <div className="space-y-4">
          <Label htmlFor="learning" className="text-base font-semibold">
            What was your key learning or adaptation?
          </Label>
          <Textarea
            id="learning"
            placeholder="Optional: What should we do differently next time?"
            className="min-h-[80px]"
            {...register('learning')}
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="tomorrowPlan" className="text-base font-semibold">
            What is your #1 priority for tomorrow?
          </Label>
          <Textarea
            id="tomorrowPlan"
            placeholder="e.g., Complete the draft proposal for UNICEF."
            className="min-h-[80px]"
            {...register('tomorrowPlan')}
          />
           {errors.tomorrowPlan && (
                <p className="text-sm text-destructive mt-2">
                    {`${errors.tomorrowPlan.message}`}
                </p>
            )}
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
