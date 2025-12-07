

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
import { Loader2, LogOut, Check, X, ArrowLeft } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useMemoFirebase
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
import { Progress } from '../ui/progress';
import { createAlert } from '@/ai/flows/create-alert-flow';

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

function GeneralCheckoutForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: any) => void,
  isSubmitting: boolean,
}) {
  const { register, handleSubmit: handleGeneralSubmit, formState: { errors: generalErrors } } = useForm({
    defaultValues: {
      accomplishment: '',
      learning: '',
      tomorrowPlan: '',
    },
  });

  const onGeneralSubmit = (data: any) => {
    // Adapt the general form data to the structure expected by the main onSubmit function
    const adaptedData = {
      tasks: [{ description: data.accomplishment, status: 'Done' as const }],
      learning: data.learning,
      tomorrowPlan: data.tomorrowPlan,
    };
    onSubmit(adaptedData);
  };
  
  return (
    <form onSubmit={handleGeneralSubmit(onGeneralSubmit)} className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="accomplishment" className="text-base font-semibold">What was your main accomplishment today?</Label>
            <Textarea id="accomplishment" {...register('accomplishment', { required: 'This field is required.'})} placeholder="e.g., I finalized the partnership MoU with Spouts of Water." className="min-h-[100px]"/>
            {generalErrors.accomplishment && <p className="text-sm text-destructive">{generalErrors.accomplishment.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="learning" className="text-base font-semibold">What was your key learning or adaptation?</Label>
            <Textarea id="learning" placeholder="Optional: What should we do differently next time? What surprised you?" className="min-h-[100px]" {...register('learning')} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="tomorrowPlan" className="text-base font-semibold">What is your #1 priority for tomorrow?</Label>
            <Textarea id="tomorrowPlan" placeholder="e.g., Begin outreach to 5 new potential partners." className="min-h-[100px]" {...register('tomorrowPlan', { required: 'Please set a priority for tomorrow.'})} />
             {generalErrors.tomorrowPlan && <p className="text-sm text-destructive">{generalErrors.tomorrowPlan.message}</p>}
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
            Submit General Checkout
        </Button>
    </form>
  )
}

export function CheckoutForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const router = useRouter();
  
  const [dailyCheckin, setDailyCheckin] = useState<Checkin | null>(null);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(true);
  const [step, setStep] = useState(0); // 0 = tasks, 1 = reflection

  const {
    control,
    handleSubmit,
    register,
    watch,
    trigger,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
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


  const onSubmit = async (data: CheckoutFormData) => {
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
    
    try {
        await addDocumentNonBlocking(checkoutsCollection, checkoutData)
        
        await createAlert({
            type: 'Info',
            priority: 'Low',
            message: `${profile.name} has submitted their end-of-day report.`,
            action: '/stream',
            creatorId: user.uid,
        });

        toast({
            title: 'Check-out Submitted!',
            description: 'Your impact report has been saved to the Team Stream.',
        });
        reset({tasks: [], learning: '', tomorrowPlan: ''}); // Clear form on success
        router.push('/stream');
    } catch(e) {
        console.error("Failed to submit checkout", e)
    }
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Check-in Found For Today</AlertTitle>
            <AlertDescription className="mt-4">
                You can submit a general checkout report below.
            </AlertDescription>
            <div className="mt-6">
                <GeneralCheckoutForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
            </div>
         </Alert>
      )
  }

  const handleNextStep = async () => {
    const allTasksReviewed = watch('tasks').every(task => task.status === 'Done' || task.status === 'Not Done');
    if (allTasksReviewed) {
        setStep(1);
    } else {
        toast({
            variant: 'destructive',
            title: 'Incomplete Review',
            description: 'Please mark all tasks as "Done" or "Not Done".'
        });
    }
  }
  
  const progress = ((step + 1) / 2) * 100;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Progress value={progress} className="h-2" />
        {step === 0 && (
          <div>
              <Label className="text-base font-semibold">
                  1. Review Today's Planned Tasks
              </Label>
              <p className="text-sm text-muted-foreground mb-4">How did your day go against the plan?</p>

              <div className="space-y-4">
                  {fields.map((field, index) => {
                      const taskStatus = watch(`tasks.${index}.status`);
                      return (
                          <Card key={field.id} className="p-4">
                              <p className="font-medium mb-3">{field.description}</p>
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
                                          <Label htmlFor={`done-${index}`} className="flex items-center gap-2 cursor-pointer"><Check className="h-4 w-4 text-green-500"/>Done</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Not Done" id={`not-done-${index}`} />
                                          <Label htmlFor={`not-done-${index}`} className="flex items-center gap-2 cursor-pointer"><X className="h-4 w-4 text-red-500"/>Not Done</Label>
                                      </div>
                                      </RadioGroup>
                                  )}
                              />
                              {taskStatus === 'Not Done' && (
                                  <div className="mt-3 space-y-1 animate-in fade-in">
                                      <Label htmlFor={`tasks.${index}.reason`} className="text-xs">Reason (optional)</Label>
                                      <Textarea
                                          id={`tasks.${index}.reason`}
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
              <Button size="lg" type="button" onClick={handleNextStep} className="w-full mt-6">Next: Reflection &amp; Planning</Button>
          </div>
        )}

        {step === 1 && (
            <div className="space-y-8 animate-in fade-in">
                 <div>
                    <Button variant="ghost" onClick={() => setStep(0)} className="mb-4 pl-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Task Review
                    </Button>
                     <div className="space-y-4">
                        <Label htmlFor="learning" className="text-base font-semibold">
                            2. What was your key learning or adaptation?
                        </Label>
                        <Textarea
                            id="learning"
                            placeholder="Optional: What should we do differently next time? What surprised you?"
                            className="min-h-[100px]"
                            {...register('learning')}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="tomorrowPlan" className="text-base font-semibold">
                    3. What is your #1 priority for tomorrow?
                  </Label>
                  <Textarea
                    id="tomorrowPlan"
                    placeholder="e.g., Complete the draft proposal for UNICEF."
                    className="min-h-[100px]"
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
                    disabled={isSubmitting || !isValid}
                >
                    {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                    <LogOut className="mr-2 h-5 w-5" />
                    )}
                    Check Out & Submit Report
                </Button>
            </div>
        )}
      </div>
    </form>
  );
}
