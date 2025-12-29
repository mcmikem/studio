
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
import { DailyPlannerAIOutputSchema } from '@/lib/types';
import { Separator } from '../ui/separator';

const checkinSchema = z.object({
  primaryMission: z.string().min(1, "Primary mission is required."),
  mood: z.string().min(1, "Mood is required."),
  details: DailyPlannerAIOutputSchema, // Use the schema directly
});

function CheckinFormComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useUserProfile(user);

    const { handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
        resolver: zodResolver(checkinSchema),
        defaultValues: {
            primaryMission: '',
            mood: '',
            details: undefined, // Initialize as undefined
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
                // No longer navigate away, allow user to stay on page or navigate manually
            }
        }
    }, [planDataString, setValue, toast]);
    
    const submittedPlan = watch('details');
    const primaryMission = watch('primaryMission');

    const onSubmit = async (data: z.infer<typeof checkinSchema>) => {
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
        return planDataString && submittedPlan && primaryMission;
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
                    <p className="text-muted-foreground">It looks like you haven't generated a plan yet.</p>
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
                                {submittedPlan.timeBlocks.map((block, index) => (
                                    <li key={index}><strong>{block.startTime} - {block.endTime}:</strong> {block.description}</li>
                                ))}
                            </ul>
                        </div>
                         <div className="space-y-4">
                             <h4 className="font-semibold text-md">Multi-Win Connections</h4>
                            <ul className="list-disc list-inside space-y-2 text-base sm:text-sm">
                                {submittedPlan.multiWinConnections.map((connection, index) => (
                                    <li key={index}>{connection}</li>
                                ))}
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
