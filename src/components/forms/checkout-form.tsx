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
  addDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const checkoutSchema = z.object({
  task: z
    .string()
    .min(10, 'Please provide a meaningful summary of what you accomplished.'),
  learning: z.string().optional(),
  tomorrowPlan: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

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
      task: data.task,
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
        router.push('/stream'); // Redirect to the stream to see the update
      })
      .catch((e: any) => {
        console.error("Failed to submit checkout", e)
      });
  };
  

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div className="space-y-4">
          <Label
            htmlFor="mission-accomplished"
            className="text-base font-semibold"
          >
            What was your main accomplishment today?
          </Label>
          <Textarea
            id="mission-accomplished"
            placeholder={
              'e.g., Finalized RED Campaign report and submitted to GlobalGiving. Use #hashtags to categorize!'
            }
            className="min-h-[120px]"
            {...register('task')}
          />
          {errors.task && (
            <p className="text-sm text-destructive">
              {`${errors.task.message}`}
            </p>
          )}
        </div>

        <Separator />

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

        <Separator />

        <div className="space-y-4">
          <Label htmlFor="tomorrow-plan" className="text-base font-semibold">
            What is your top priority for tomorrow?
          </Label>
          <Input
            id="tomorrow-plan"
            placeholder="Optional: Tomorrow's priority will be..."
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
