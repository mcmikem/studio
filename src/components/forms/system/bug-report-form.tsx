'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { createAlert } from '@/ai/flows/create-alert-flow';

const bugReportSchema = z.object({
  type: z.enum(['bug', 'feature']),
  description: z.string().min(15, 'Please provide a detailed description.'),
});

type BugReportFormData = z.infer<typeof bugReportSchema>;

export function BugReportForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BugReportFormData>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      type: 'bug',
    },
  });

  const onSubmit = async (data: BugReportFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit feedback.' });
      return;
    }

    const feedbackData = {
      ...data,
      userId: user.uid,
      userName: profile.name,
      status: 'New',
      timestamp: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'feedback'), feedbackData);
      
      const managementUsersQuery = query(collection(firestore, 'users'), where('role', 'in', ['Executive Director', 'Administrator']));
      const managementSnapshot = await getDocs(managementUsersQuery);
      const managerIds = managementSnapshot.docs.map(d => d.id);

      if (managerIds.length > 0) {
        await createAlert({
            type: 'Urgent',
            priority: 'Medium',
            message: `A new ${data.type} report has been submitted by ${profile.name}.`,
            action: '/management/feedback', // This page needs to be created
            creatorId: user.uid,
            targetUserIds: managerIds,
        });
      }

      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for your feedback. The team has been notified.',
      });
      reset();
      router.push('/forms');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/forms">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            System Feedback &amp; Bug Report
          </CardTitle>
          <CardDescription>
            Report an issue, bug, or suggest a new feature for Omuto Central.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label>Type of Feedback</Label>
                 <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="bug" id="bug" /><Label htmlFor="bug">Bug Report</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="feature" id="feature" /><Label htmlFor="feature">Feature Request</Label></div>
                    </RadioGroup>
                    )}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Please be as detailed as possible. What happened? What did you expect to happen?"
                className="min-h-[150px]"
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
