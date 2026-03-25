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
import { Loader2, LogOut, Check, X, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
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
  getDocs,
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Checkin } from '@/lib/types';
import { Progress } from '../ui/progress';
import { createAlertAction as createAlert } from '@/actions/mutations';

const checkoutTaskSchema = z.object({
  description: z.string(),
  status: z.enum(['Done', 'Not Done']),
  reason: z.string().optional(),
});

const checkoutSchema = z.object({
  // Made tasks optional for general checkout flow
  tasks: z.array(checkoutTaskSchema).optional(),
  // Added accomplishment field for general checkout
  accomplishment: z.string().optional(),
  learning: z.string().optional(),
  tomorrowPlan: z.string().min(5, 'Please set a priority for tomorrow.'),
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
  const [step, setStep] = useState(0); // 0 = tasks, 1 = reflection

  const {
    control,
    handleSubmit,
    register,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      tasks: [],
      accomplishment: '',
      learning: '',
      tomorrowPlan: '',
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'tasks',
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
      limit(1),
    );

    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const checkinData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as Checkin;
        setDailyCheckin(checkinData);

        const tasksFromCheckin =
          checkinData.details?.timeBlocks.map((block: any) => ({
            description: block.description,
            status: 'Done' as 'Done' | 'Not Done',
            reason: '',
          })) || [];
        replace(tasksFromCheckin); // Use replace to set the tasks array
      } else {
        setDailyCheckin(null);
      }
    } catch (e) {
      console.error('Error fetching check-in:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your daily plan.',
      });
    } finally {
      setIsLoadingCheckin(false);
    }
  }, [user, firestore, replace, toast]);

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

    let finalTasks = data.tasks || [];

    if (!dailyCheckin && data.accomplishment) {
      // If no daily check-in, create a single task from accomplishment
      finalTasks = [
        {
          description: data.accomplishment,
          status: 'Done',
          reason: '',
        },
      ];
    } else if (!dailyCheckin && !data.accomplishment) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide your main accomplishment for the day.',
      });
      return;
    }

    const checkoutData = {
      name: profile.name,
      role: profile.role,
      avatar: user.photoURL || '',
      tasks: finalTasks,
      learning: data.learning || '',
      tomorrowPlan: data.tomorrowPlan || '',
      timestamp: serverTimestamp(),
      userId: user.uid,
    };

    const checkoutsCollection = collection(firestore, 'checkouts');

    try {
      await addDocumentNonBlocking(checkoutsCollection, checkoutData);

      try {
        await createAlert({
          type: 'Info',
          priority: 'Low',
          message: `${profile.name} has submitted their end-of-day report.`,
          action: '/stream',
          creatorId: user.uid,
        });
      } catch (alertError) {
        console.error('Failed to create alert for checkout:', alertError);
      }

      toast({
        title: 'Check-out Submitted!',
        description: 'Your impact report has been saved to the Team Stream.',
      });
      reset({
        tasks: [],
        accomplishment: '',
        learning: '',
        tomorrowPlan: '',
      }); // Clear form on success
      router.push('/stream');
    } catch (e) {
      console.error('Failed to submit checkout', e);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Could not submit your checkout. Please try again.',
      });
    }
  };

  if (isLoadingCheckin) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Render general checkout fields if no dailyCheckin
  if (!dailyCheckin) {
    return (
      <Card className="overflow-hidden border shadow-sm w-full">
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white border shadow-sm rounded-xl flex-shrink-0">
                    <LogOut className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                        General Check-out
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        End-of-Day Impact Terminal
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-8">
            <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">No Records Found</AlertTitle>
                <AlertDescription className="text-amber-700 font-medium">
                It looks like you didn&apos;t check in today. Please submit a general
                checkout report below.
                </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                    <Label htmlFor="accomplishment" className="text-xs font-bold uppercase tracking-widest text-omuto-navy">
                        Main Accomplishment
                    </Label>
                    <Textarea
                        id="accomplishment"
                        {...register('accomplishment', {
                            required: 'This field is required.',
                        })}
                        placeholder="Describe what you achieved today..."
                        className="min-h-[120px] border rounded-xl font-medium focus-visible:ring-primary"
                    />
                    {errors.accomplishment && (
                        <p className="text-xs text-destructive font-bold">
                            {errors.accomplishment.message}
                        </p>
                    )}
                </div>
                <div className="space-y-3">
                    <Label htmlFor="learning" className="text-xs font-bold uppercase tracking-widest text-omuto-navy">
                        Key Learning or Adaptation
                    </Label>
                    <Textarea
                        id="learning"
                        placeholder="What did you learn or adapt today?"
                        className="min-h-[120px] border rounded-xl font-medium focus-visible:ring-primary"
                        {...register('learning')}
                    />
                </div>
                <div className="space-y-3">
                    <Label htmlFor="tomorrowPlan" className="text-xs font-bold uppercase tracking-widest text-omuto-navy">
                        #1 Priority for Tomorrow
                    </Label>
                    <Textarea
                        id="tomorrowPlan"
                        placeholder="What will you focus on tomorrow?"
                        className="min-h-[120px] border rounded-xl font-medium focus-visible:ring-primary"
                        {...register('tomorrowPlan', {
                            required: 'Please set a priority for tomorrow.',
                        })}
                    />
                    {errors.tomorrowPlan && (
                        <p className="text-xs text-destructive font-bold">
                            {errors.tomorrowPlan.message}
                        </p>
                    )}
                </div>
                <Button
                    size="lg"
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm group"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    )}
                    FINALIZE SHIPMENT & CHECK-OUT
                </Button>
            </form>
        </CardContent>
      </Card>
    );
  }

  const handleNextStep = async () => {
    // Trigger validation for all tasks to ensure all are marked
    const isValidTasks = await trigger('tasks');

    if (isValidTasks) {
      setStep(1);
    } else {
      toast({
        variant: 'destructive',
        title: 'Incomplete Review',
        description:
          'Please mark all tasks as "Done" or "Not Done".',
      });
    }
  };

  const progress = ((step + 1) / 2) * 100;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Progress value={progress} className="h-2" />
        {step === 0 && (
      <Card className="overflow-hidden border shadow-sm w-full">
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white border shadow-sm rounded-xl flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                        Impact Review
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Verifying Daily Mission Results
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary">
                1. Review Today&apos;s Planned Tasks
              </Label>
              <p className="text-sm text-muted-foreground font-medium">
                How did your day go against the plan?
              </p>

              <div className="space-y-4 pt-2">
                {fields.map((field, index) => {
                  const taskStatus = watch(`tasks.${index}.status`);
                  return (
                    <div key={field.id} className="p-5 bg-muted/20 border rounded-2xl space-y-4">
                      <p className="font-bold text-omuto-navy leading-snug">
                        {field.description}
                      </p>
                      <Controller
                        control={control}
                        name={`tasks.${index}.status`}
                        render={({ field: controllerField }) => (
                          <RadioGroup
                            onValueChange={controllerField.onChange}
                            defaultValue={controllerField.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="Done"
                                id={`done-${index}`}
                              />
                              <Label
                                htmlFor={`done-${index}`}
                                className="flex items-center gap-2 cursor-pointer font-bold text-sm text-green-700"
                              >
                                <Check className="h-4 w-4" />
                                DONE
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="Not Done"
                                id={`not-done-${index}`}
                              />
                              <Label
                                htmlFor={`not-done-${index}`}
                                className="flex items-center gap-2 cursor-pointer font-bold text-sm text-red-600"
                              >
                                <X className="h-4 w-4" />
                                PENDING
                              </Label>
                            </div>
                          </RadioGroup>
                        )}
                      />
                      {taskStatus === 'Not Done' && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <Label
                            htmlFor={`tasks.${index}.reason`}
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Reason for Non-Completion
                          </Label>
                          <Textarea
                            id={`tasks.${index}.reason`}
                            placeholder="Why wasn't this task completed?"
                            className="min-h-[80px] border rounded-xl font-medium"
                            {...register(`tasks.${index}.reason`)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              size="lg"
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 bg-omuto-navy hover:bg-omuto-navy/90 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              NEXT: REFLECTION & PLANNING
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </CardContent>
      </Card>
        )}

        {step === 1 && (
          <Card className="overflow-hidden border shadow-sm w-full animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white border shadow-sm rounded-xl flex-shrink-0">
                        <ArrowLeft className="h-6 w-6 text-primary cursor-pointer" onClick={() => setStep(0)} />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                            Reflection & Planning
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Harvesting Today&apos;s Wisdom
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-10">
                <div className="space-y-4">
                  <Label
                    htmlFor="learning"
                    className="text-xs font-bold uppercase tracking-widest text-primary"
                  >
                    2. What was your key learning or adaptation?
                  </Label>
                  <Textarea
                    id="learning"
                    placeholder="Capture what you learned or adapted today..."
                    className="min-h-[150px] border rounded-xl font-medium focus-visible:ring-primary"
                    {...register('learning')}
                  />
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="tomorrowPlan"
                    className="text-xs font-bold uppercase tracking-widest text-primary"
                  >
                    3. What is your #1 priority for tomorrow?
                  </Label>
                  <Textarea
                    id="tomorrowPlan"
                    placeholder="Focus your intent for the next mission cycle..."
                    className="min-h-[150px] border rounded-xl font-medium focus-visible:ring-primary"
                    {...register('tomorrowPlan')}
                  />
                  {errors.tomorrowPlan && (
                    <p className="text-xs text-destructive font-bold mt-2">
                      {`${errors.tomorrowPlan.message}`}
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm group"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  )}
                  FINALIZE SHIPMENT & CHECK-OUT
                </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </form>
  );
}
