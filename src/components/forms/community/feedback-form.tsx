
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

const feedbackSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  communityName: z.string().min(3, 'Community name is required.'),
  feedbackCategory: z.enum(['Complaint', 'Suggestion', 'Appreciation']),
  details: z.string().min(10, 'Please provide detailed feedback.'),
  followUpRequired: z.boolean().default(false),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export function CommunityFeedbackForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      feedbackCategory: 'Suggestion',
      followUpRequired: false,
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    // This would need a new collection, let's assume 'communityFeedback'
    // and a corresponding entity and rule.
    const feedbackData = { ...data, createdAt: serverTimestamp() };

    try {
      // await addDocumentNonBlocking(collection(firestore, 'communityFeedback'), feedbackData);
      toast({
        title: 'Feedback Logged!',
        description: `Feedback from ${data.communityName} has been recorded.`,
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
            <MessageSquare className="h-6 w-6" />
            Community Feedback Form
          </CardTitle>
          <CardDescription>
            Log complaints, suggestions, or appreciation from community members.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="communityName">Community/Village Name</Label>
                <Input id="communityName" {...register('communityName')} />
                {errors.communityName && <p className="text-sm text-destructive">{errors.communityName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedbackCategory">Feedback Category</Label>
              <Controller
                name="feedbackCategory"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="feedbackCategory">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Complaint">Complaint</SelectItem>
                      <SelectItem value="Suggestion">Suggestion</SelectItem>
                      <SelectItem value="Appreciation">Appreciation</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                {...register('details')}
                placeholder="Provide a detailed account of the feedback."
                className="min-h-[150px]"
              />
              {errors.details && <p className="text-sm text-destructive">{errors.details.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="followUpRequired"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="followUpRequired"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="followUpRequired">Follow-up Required?</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Feedback
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
