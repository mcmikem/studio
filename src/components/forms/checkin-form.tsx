
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
import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { DailyPlannerAIOutputSchema, type DailyPlannerAIOutput } from '@/lib/types';
import { Separator } from '../ui/separator';
import { createAlertAction as createAlert } from '@/actions/mutations';

const checkinSchema = z.object({
  primaryMission: z.string().min(1, "Primary mission is required."),
  mood: z.string().min(1, "Mood is required."),
  details: DailyPlannerAIOutputSchema, // Use the schema directly
});

type CheckinFormValues = z.infer<typeof checkinSchema>;

function CheckinFormComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useUserProfile(user);

    const { handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<CheckinFormValues>({
        resolver: zodResolver(checkinSchema),
        defaultValues: {
            primaryMission: '',
            mood: '',
            // We need to cast this because zodResolver expect a complete object
            details: undefined as unknown as DailyPlannerAIOutput, 
        }
    });

    const planDataString = searchParams.get('plan');
    
    useEffect(() => {
        if (planDataString) {
            try {
                const planData = JSON.parse(decodeURIComponent(planDataString));
                setValue('primaryMission', planData.primaryMission);
                setValue('details', planData.details);
                setValue('mood', planData.mood);
            } catch (error) {
                console.error("Failed to parse plan data:", error);
                toast({
                    variant: "destructive",
                    title: "Error loading plan",
                    description: "There was an issue loading your daily plan. Please try generating it again."
                });
            }
        }
    }, [planDataString, setValue, toast]);
    
    const submittedPlan = watch('details');
    const primaryMission = watch('primaryMission');

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
            details: data.details,
            timestamp: serverTimestamp(),
        };

        const checkinsCollection = collection(firestore, 'checkins');
        
        try {
            await addDocumentNonBlocking(checkinsCollection, checkinData);
            
             // Create an alert for the check-in
             try {
                await createAlert({
                    type: 'Info',
                    priority: 'Low',
                    message: `${profile.name} has checked in: "${data.primaryMission}"`,
                    action: '/checkins',
                    creatorId: user.uid,
                });
            } catch (alertError) {
                console.error("Failed to create alert for check-in:", alertError);
            }

            toast({
                title: 'Check-in Submitted!',
                description: 'Your plan for the day is now visible to the team.',
            });
            router.push('/');
        } catch (error) {
            console.error("Failed to submit check-in:", error);
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: 'Could not submit your check-in. Please try again.',
            });
        }
    };

    const shouldRenderPlan = useMemo(() => {
        return !!(planDataString && submittedPlan?.timeBlocks && primaryMission);
    }, [planDataString, submittedPlan, primaryMission]);

    if (!shouldRenderPlan) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daily Check-in</CardTitle>
                    <CardDescription>
                        First, generate a daily plan with the AI coach.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">It looks like you haven't generated a plan yet or the plan is incomplete.</p>
                    <Button asChild className="mt-4">
                        <Link href="/daily-plan">
                            Go to AI Daily Planner
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Confirm Your Daily Check-in</CardTitle>
                    <CardDescription>
                        Review your plan below and submit it to the team stream.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg">{primaryMission}</h3>
                        <p className="text-sm text-muted-foreground">Your main focus for today.</p>
                    </div>

                    <Separator />
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <h4 className="font-semibold text-md">Key Time Blocks</h4>
                            <ul className="list-disc list-inside space-y-2 text-base sm:text-sm">
                                {submittedPlan?.timeBlocks?.map((block, index) => (
                                    <li key={index}><strong>{block.startTime} - {block.endTime}:</strong> {block.description}</li>
                                ))}
                                {(!submittedPlan?.timeBlocks || submittedPlan.timeBlocks.length === 0) && (
                                    <li className="text-muted-foreground italic">No specific time blocks generated.</li>
                                )}
                            </ul>
                        </div>
                         <div className="space-y-4">
                             <h4 className="font-semibold text-md">Strategic Alignments</h4>
                            <ul className="list-inside space-y-3">
                                {submittedPlan?.strategicAlignments?.map((align, index) => (
                                    <li key={index} className="text-sm p-3 bg-muted/50 rounded-lg">
                                        <p className="font-bold">{align.krTitle}</p>
                                        <p className="text-muted-foreground mt-1">{align.alignmentJustification}</p>
                                    </li>
                                ))}
                                {(!submittedPlan?.strategicAlignments || submittedPlan.strategicAlignments.length === 0) && (
                                    <li className="text-muted-foreground italic text-sm">No strategic alignments identified.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Check-in to Team
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}


export function CheckinForm() {
    return (
        <Suspense fallback={<Card><CardContent><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>}>
            <CheckinFormComponent />
        </Suspense>
    )
}
