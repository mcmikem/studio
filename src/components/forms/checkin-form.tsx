
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, LogIn, Zap, Clock, Target, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '../ui/separator';
import { createAlertAction as createAlert } from '@/actions/mutations';

const quickCheckinSchema = z.object({
  primaryMission: z.string().min(5, "What's your main focus today? (at least 5 characters)"),
  mood: z.string().min(1, "How are you feeling?"),
});

const fullCheckinSchema = z.object({
  primaryMission: z.string().min(1, "Primary mission is required."),
  mood: z.string().min(1, "Mood is required."),
  workingStartTime: z.string().optional(),
  workingEndTime: z.string().optional(),
  details: z.any().optional(),
});

type CheckinFormValues = z.infer<typeof fullCheckinSchema>;

const MOOD_OPTIONS = [
  { value: 'good', label: 'Great', emoji: '😊' },
  { value: 'neutral', label: 'Okay', emoji: '😐' },
  { value: 'bad', label: 'Tough', emoji: '😤' },
];

function CheckinFormComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const [useQuickMode, setUseQuickMode] = useState(false);

    const { handleSubmit, setValue, watch, register, formState: { isSubmitting, errors } } = useForm<CheckinFormValues>({
        resolver: zodResolver(fullCheckinSchema),
        defaultValues: {
            primaryMission: '',
            mood: '',
            workingStartTime: '08:30',
            workingEndTime: '17:00',
            details: undefined,
        }
    });

    const planDataString = searchParams.get('plan');
    const hasAIData = !!planDataString;
    
    useEffect(() => {
        if (planDataString) {
            try {
                const planData = JSON.parse(decodeURIComponent(planDataString));
                setValue('primaryMission', planData.primaryMission);
                setValue('details', planData.details);
                setValue('mood', planData.mood);
                if (planData.workingStartTime) setValue('workingStartTime', planData.workingStartTime);
                if (planData.workingEndTime) setValue('workingEndTime', planData.workingEndTime);
            } catch (error) {
                console.error("Failed to parse plan data:", error);
            }
        }
    }, [planDataString, setValue]);
    
    const submittedPlan = watch('details');
    const primaryMission = watch('primaryMission');
    const selectedMood = watch('mood');

    const onSubmit = async (data: CheckinFormValues) => {
        if (!firestore || !user || !profile) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You must be logged in to submit a check-in.',
            });
            return;
        }

        const checkinData = {
            userId: user.uid,
            name: profile.name,
            primaryMission: data.primaryMission,
            mood: data.mood,
            workingStartTime: data.workingStartTime || "08:30",
            workingEndTime: data.workingEndTime || "17:00",
            details: data.details || null,
            timestamp: serverTimestamp(),
        };

        const checkinsCollection = collection(firestore, 'checkins');
        
        try {
            await addDocumentNonBlocking(checkinsCollection, checkinData);
            
             try {
                await createAlert({
                    type: 'Info',
                    priority: 'Low',
                    message: `${profile.name} has checked in: "${data.primaryMission}"`,
                    action: '/checkins',
                    creatorId: user.uid,
                });
            } catch (alertError) {
                // Alert failure is non-critical
            }

            toast({
                title: 'Check-in Submitted!',
                description: 'Your plan for the day is now visible to the team.',
            });
            router.push('/');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: 'Could not submit your check-in. Please try again.',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="overflow-hidden border shadow-sm w-full">
                <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-card border shadow-sm rounded-xl flex-shrink-0">
                            <LogIn className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                                {hasAIData ? 'Confirm Daily Check-in' : 'Quick Check-in'}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {hasAIData ? 'AI-Assisted Plan' : 'Manual Check-in'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {!hasAIData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-bold text-blue-700">Want an AI-generated plan?</span>
                            </div>
                            <p className="text-xs text-blue-600 mb-3">
                                Use the AI Daily Planner for a structured plan with time blocks and strategic alignments.
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/daily-plan">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Generate AI Plan
                                </Link>
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="font-bold text-sm">What is your #1 mission for today?</Label>
                        <Textarea
                            {...register('primaryMission')}
                            placeholder="e.g., Visit 3 schools in Mpigi district for GreenSchools tree surveys"
                            className="min-h-[80px]"
                        />
                        {errors.primaryMission && (
                            <p className="text-xs text-destructive">{errors.primaryMission.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-sm">How are you feeling?</Label>
                        <div className="flex gap-3">
                            {MOOD_OPTIONS.map(mood => (
                                <button
                                    key={mood.value}
                                    type="button"
                                    onClick={() => setValue('mood', mood.value)}
                                    className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all text-center ${
                                        selectedMood === mood.value 
                                            ? 'border-primary bg-primary/10 shadow-md' 
                                            : 'border-muted hover:border-primary/30'
                                    }`}
                                >
                                    <span className="text-2xl block">{mood.emoji}</span>
                                    <span className="text-xs font-bold mt-1 block">{mood.label}</span>
                                </button>
                            ))}
                        </div>
                        {errors.mood && (
                            <p className="text-xs text-destructive">{errors.mood.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Start Time
                            </Label>
                            <Input
                                type="time"
                                {...register('workingStartTime')}
                                defaultValue="08:30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                End Time
                            </Label>
                            <Input
                                type="time"
                                {...register('workingEndTime')}
                                defaultValue="17:00"
                            />
                        </div>
                    </div>

                    {hasAIData && submittedPlan && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    AI-Generated Time Blocks
                                </h4>
                                <div className="space-y-2">
                                    {(submittedPlan as any)?.timeBlocks?.map((block: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                            <span className="text-xs font-bold text-primary whitespace-nowrap">
                                                {block.startTime} - {block.endTime}
                                            </span>
                                            <span className="text-xs truncate flex-1">{block.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 sm:p-6 lg:p-8">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking In...
                            </>
                        ) : (
                            <>
                                <LogIn className="mr-2 h-4 w-4" />
                                Check In
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

export function CheckinForm() {
    return (
        <Suspense fallback={<Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>}>
            <CheckinFormComponent />
        </Suspense>
    );
}
