
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
import { Loader2, ArrowRight, LogIn, Zap, Clock, Target } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DailyPlannerAIOutputSchema, type DailyPlannerAIOutput } from '@/lib/types';
import { Separator } from '../ui/separator';
import { createAlertAction as createAlert } from '@/actions/mutations';

const checkinSchema = z.object({
  primaryMission: z.string().min(1, "Primary mission is required."),
  mood: z.string().min(1, "Mood is required."),
  workingStartTime: z.string().optional(),
  workingEndTime: z.string().optional(),
  details: DailyPlannerAIOutputSchema,
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
                if (planData.workingStartTime) setValue('workingStartTime', planData.workingStartTime);
                if (planData.workingEndTime) setValue('workingEndTime', planData.workingEndTime);
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
            workingStartTime: data.workingStartTime || "08:30",
            workingEndTime: data.workingEndTime || "17:00",
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
        return !!(planDataString && primaryMission);
    }, [planDataString, primaryMission]);

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
            <Card className="overflow-hidden border shadow-sm w-full">
                <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-card border shadow-sm rounded-xl flex-shrink-0">
                            <LogIn className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                                Confirm Daily Check-in
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                Mission Deployment Terminal
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Zap className="h-12 w-12 text-primary" />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Primary Mission</Label>
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-omuto-navy tracking-tight leading-tight">{primaryMission}</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-bold text-xs uppercase tracking-wider text-omuto-navy">Strategy & Time Blocks</h4>
                            </div>
                            <div className="space-y-3">
                                {submittedPlan?.timeBlocks?.map((block, index) => (
                                    <div key={index} className="p-4 bg-muted/30 border rounded-xl flex gap-4 items-start">
                                        <div className="text-[10px] font-bold text-primary bg-white dark:bg-card border px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                                            {block?.startTime}
                                        </div>
                                        <p className="text-sm font-medium text-omuto-navy leading-snug">{block?.description}</p>
                                    </div>
                                ))}
                                {(!submittedPlan?.timeBlocks || submittedPlan.timeBlocks.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic px-1">No time blocks generated.</p>
                                )}
                            </div>
                        </div>

                         <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-bold text-xs uppercase tracking-wider text-omuto-navy">Impact Alignment</h4>
                            </div>
                            <div className="space-y-3">
                                {submittedPlan?.strategicAlignments?.map((align, index) => (
                                    <div key={index} className="p-4 bg-omuto-navy/5 border border-omuto-navy/10 rounded-xl">
                                        <p className="font-bold text-sm text-omuto-navy">{align.krTitle}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{align.alignmentJustification}</p>
                                    </div>
                                ))}
                                {(!submittedPlan?.strategicAlignments || submittedPlan.strategicAlignments.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic px-1">No alignments identified.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="p-4 sm:p-6 lg:p-8 bg-muted/30 border-t">
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm group">
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        )}
                        DEPLOY MISSION TO STREAM
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
