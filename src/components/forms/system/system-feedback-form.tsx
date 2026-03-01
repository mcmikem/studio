
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
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
import { Loader2, ArrowLeft, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { createAlert } from '@/ai/actions';
import { SystemFeedbackSchema } from '@/lib/types';

type SystemFeedbackFormData = z.infer<typeof SystemFeedbackSchema>;

export function SystemFeedbackForm() {
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
  } = useForm<SystemFeedbackFormData>({
    resolver: zodResolver(SystemFeedbackSchema.omit({ id: true, createdAt: true, reported_by: true, status: true })),
    defaultValues: {
      type: 'Bug',
      priority: 'Medium',
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: SystemFeedbackFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit feedback.' });
      return;
    }

    const feedbackData = {
      ...data,
      reported_by: profile.name,
      status: 'New',
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'system-feedback'), feedbackData);
      
      // Create an alert for management when a bug or feature request is submitted
      const managementUsersQuery = query(collection(firestore, 'users'), where('role', 'in', ['Executive Director', 'Administrator']));
      const managementSnapshot = await getDocs(managementUsersQuery);
      const managerIds = managementSnapshot.docs.map(d => d.id);

      if (managerIds.length > 0) {
        await createAlert({
            type: data.type === 'Bug' ? 'Urgent' : 'Info',
            priority: data.type === 'Bug' ? 'High' : data.priority || 'Medium',
            message: `New ${data.type} report: "${data.title}" by ${profile.name}.`,
            action: '/management/feedback', 
            creatorId: user.uid,
            targetUserIds: managerIds,
        });
      }

      toast({
        title: 'Feedback Submitted!',
        description: `Your ${data.type} has been submitted. Thank you for helping improve Omuto Central!`,
      });
      reset();
      router.push('/forms');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/forms">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms Hub
        </Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter"><Bug className="h-8 w-8 text-primary"/> System Feedback</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Report issues, suggest features, or provide general feedback for Omuto Central.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
             <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Feedback Type</Label>
                 <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Bug" id="type-bug" /><Label htmlFor="type-bug" className="font-bold">Bug Report <Bug className="ml-1 h-4 w-4 inline"/></Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Feature" id="type-feature" /><Label htmlFor="type-feature" className="font-bold">Feature Request <Lightbulb className="ml-1 h-4 w-4 inline"/></Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Feedback" id="type-feedback" /><Label htmlFor="type-feedback" className="font-bold">General Feedback <MessageSquare className="ml-1 h-4 w-4 inline"/></Label></div>
                    </RadioGroup>
                    )}
                />
                {errors.type && <p className="text-xs text-destructive font-bold">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="font-bold text-xs uppercase tracking-widest">Short Summary/Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g., App crashes on login" className="border-lg rounded-xl h-12" />
              {errors.title && <p className="text-xs text-destructive font-bold">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase tracking-widest">Detailed Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Please be as detailed as possible. What happened? What did you expect to happen? Include steps to reproduce if it's a bug."
                className="border-lg rounded-xl min-h-[150px] font-bold"
              />
              {errors.description && <p className="text-xs text-destructive font-bold">{errors.description.message}</p>}
            </div>
             <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Priority (for Feature/Feedback)</Label>
                <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Low" id="p-low" /><Label htmlFor="p-low">Low</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Medium" id="p-medium" /><Label htmlFor="p-medium">Medium</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="High" id="p-high" /><Label htmlFor="p-high">High</Label></div>
                        </RadioGroup>
                    )}
                />
                 {errors.priority && <p className="text-xs text-destructive font-bold">{errors.priority.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t-lg border-omuto-navy/10 p-8">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bug className="mr-2 h-5 w-5" />}
              Submit Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
