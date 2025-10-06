'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileUp, Loader2, LogOut } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

const checkoutSchema = z.object({
  missionAccomplished: z
    .string()
    .min(10, 'Please provide a meaningful summary.'),
  parentsReached: z.coerce.number().optional(),
  volunteersRecruited: z.coerce.number().optional(),
  prototypesTested: z.coerce.number().optional(),
  learning: z.string().optional(),
  tomorrowPlan: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      missionAccomplished:
        "Delivered RED Campaign session at Greenhill PTA meeting. The session was well-received.",
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit a report.",
        });
        return;
    }

    const impactNumbers = [
      data.parentsReached && `Parents Reached: ${data.parentsReached}`,
      data.volunteersRecruited && `Volunteers Recruited: ${data.volunteersRecruited}`,
      data.prototypesTested && `Prototypes Tested: ${data.prototypesTested}`,
    ].filter(Boolean).join(' | ');
    
    const fullTask = `${data.missionAccomplished} #Update ${impactNumbers ? `| ${impactNumbers}` : ''}`;

    const checkoutData = {
      name: user.displayName || user.email,
      role: 'User', 
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      task: fullTask,
      learning: data.learning,
      tomorrowPlan: data.tomorrowPlan,
      timestamp: serverTimestamp(),
      userId: user.uid,
    };

    const checkoutsCollection = collection(firestore, 'checkouts');
    addDocumentNonBlocking(checkoutsCollection, checkoutData);

    toast({
      title: 'Check-out Submitted!',
      description: 'Your impact report has been saved.',
    });
    reset();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Report Your Impact</CardTitle>
          <CardDescription>
            Summarize your achievements, learnings, and plan for tomorrow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label
              htmlFor="mission-accomplished"
              className="text-base font-semibold"
            >
              Section 1: Mission Accomplishment
            </Label>
            <Textarea
              id="mission-accomplished"
              placeholder="What did you achieve? (This will be pre-filled with your morning's mission)"
              className="min-h-[100px]"
              {...register('missionAccomplished')}
            />
            {errors.missionAccomplished && (
              <p className="text-sm text-destructive">
                {errors.missionAccomplished.message}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact-parents">Parents Reached</Label>
                <Input
                  id="impact-parents"
                  type="number"
                  placeholder="e.g., 35"
                  {...register('parentsReached')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact-volunteers">Volunteers Recruited</Label>
                <Input
                  id="impact-volunteers"
                  type="number"
                  placeholder="e.g., 3"
                  {...register('volunteersRecruited')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact-prototypes">Prototypes Tested</Label>
                <Input
                  id="impact-prototypes"
                  type="number"
                  placeholder="e.g., 5"
                  {...register('prototypesTested')}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Section 2: Evidence & Documentation
            </Label>
            <Button variant="outline" className="w-full" type="button" disabled>
              <FileUp className="mr-2 h-4 w-4" />
              Add Photo/Video Proof (Coming Soon)
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Photos will be automatically tagged with activity and location.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label htmlFor="learning" className="text-base font-semibold">
              Section 3: Learning & Adaptation
            </Label>
            <Textarea
              id="learning"
              placeholder="What should we do differently next time?"
              className="min-h-[80px]"
              {...register('learning')}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label htmlFor="tomorrow-plan" className="text-base font-semibold">
              Section 4: Plan Tomorrow's Win
            </Label>
            <Input
              id="tomorrow-plan"
              placeholder="Tomorrow's priority will be..."
              {...register('tomorrowPlan')}
            />
          </div>

          <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-5 w-5" />
            )}
            Check Out & Submit Report
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
