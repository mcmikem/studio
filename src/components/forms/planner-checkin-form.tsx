
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy } from 'firebase/firestore';
import { Suspense, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { dailyPlannerFlow, DailyPlannerAIOutputSchema } from '@/ai/flows/daily-planner-flow';
import type { DailyPlannerAIOutput } from '@/lib/types';
import Link from 'next/link';

const plannerCheckinSchema = z.object({
  primaryMission: z.string().min(1, "Primary mission is required."),
  mood: z.string().min(1, "Mood is required."),
  details: DailyPlannerAIOutputSchema.optional(),
});

type PlannerCheckinFormData = z.infer<typeof plannerCheckinSchema>;

function PlannerCheckinFormComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const { profile } = useUserProfile(user);

    const { handleSubmit, setValue, watch } = useForm<PlannerCheckinFormData>({
        resolver: zodResolver(plannerCheckinSchema)
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
            }
        }
    }, [planDataString, setValue]);

    const primaryMission = watch('primaryMission');

    if (!primaryMission) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Daily Check-in</CardTitle>
                    <CardDescription>First, generate a daily plan with the AI coach.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/daily-plan">
                            Go to AI Daily Planner
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // This component is now primarily for redirecting with data.
    // The actual form is in the check-in page.
    // You could enhance this to show a summary before redirecting.
    useEffect(() => {
        if (planDataString) {
            router.replace(`/forms/check-in?plan=${planDataString}`);
        }
    }, [planDataString, router]);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading your plan...</p>
                </div>
            </CardContent>
        </Card>
    );
}


export function PlannerCheckinForm() {
    return (
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <PlannerCheckinFormComponent />
        </Suspense>
    )
}
