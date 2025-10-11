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
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, DollarSign } from 'lucide-react';
import type { DailyPlannerAIOutput } from '@/lib/types';
import { Separator } from '../ui/separator';
import { useSearchParams } from 'next/navigation';
import { createAlert } from '@/ai/flows/create-alert-flow';

const checkinSchema = z.object({
  primaryMission: z.string(),
  details: z.any(),
});

function CheckinFormComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useUserProfile(user);

    const { handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
        resolver: zodResolver(checkinSchema)
    });

    const planDataString = searchParams.get('plan');
    
    useEffect(() => {
        if (planDataString) {
            try {
                const planData = JSON.parse(decodeURIComponent(planDataString));
                setValue('primaryMission', planData.primaryMission);
                setValue('details', planData.details);
                setValue('needsBudget', planData.needsBudget);
                setValue('budgetAmount', planData.budgetAmount);
                setValue('budgetTitle', planData.budgetTitle);
            } catch (error) {
                console.error("Failed to parse plan data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load the plan data. Please try again."
                });
            }
        }
    }, [planDataString, setValue, toast]);
    
    const submittedPlan = watch('details') as DailyPlannerAIOutput | null;
    const primaryMission = watch('primaryMission');
    const needsBudget = watch('needsBudget');
    const budgetAmount = watch('budgetAmount');
    const budgetTitle = watch('budgetTitle');

    const onSubmit = async (data: any) => {
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
            details: data.details,
            timestamp: serverTimestamp(),
        };

        const checkinsCollection = collection(firestore, 'checkins');
        try {
            await addDocumentNonBlocking(checkinsCollection, checkinData);

            if (needsBudget && budgetTitle && budgetAmount > 0) {
                 const expenseData = {
                    userId: user.uid,
                    userName: profile.name,
                    date: new Date().toISOString().split('T')[0], // Today's date
                    title: budgetTitle,
                    type: "Requisition" as const,
                    items: [{ description: "Funds for daily mission", category: "Other" as const, amount: budgetAmount }],
                    totalAmount: budgetAmount,
                    status: 'Pending' as const,
                    createdAt: serverTimestamp(),
                };
                const expensesCollection = collection(firestore, 'expenses');
                const docRef = await addDocumentNonBlocking(expensesCollection, expenseData);

                 await createAlert({
                    type: 'Reminder',
                    message: `New budget requisition from ${profile.name} for "${budgetTitle}" needs approval.`,
                    priority: 'Medium',
                    action: `/management/expenses?highlight=${docRef.id}`,
                    creatorId: user.uid,
                });

                toast({
                    title: 'Check-in & Requisition Submitted!',
                    description: 'Your plan is public and your budget is awaiting approval.',
                });
            } else {
                 toast({
                    title: 'Check-in Submitted!',
                    description: 'Your plan for the day is now visible to the team.',
                });
            }

            router.push('/');
        } catch (error) {
            console.error("Failed to submit check-in:", error);
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: 'Could not save your check-in. Please try again.',
            });
        }
    };


    if (!planDataString || !submittedPlan) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daily Check-in</CardTitle>
                    <CardDescription>
                        Finalize and submit your AI-assisted plan for the day.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">You don't have a plan ready to submit.</p>
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
                     {needsBudget && budgetAmount > 0 && (
                        <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/20 p-4">
                            <h4 className="font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-600"/>Budget Requisition Attached</h4>
                            <p className="text-sm text-muted-foreground mt-2">You are requesting **{new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(budgetAmount)}** for "{budgetTitle}". This will be sent for approval upon check-in.</p>
                        </div>
                    )}
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
