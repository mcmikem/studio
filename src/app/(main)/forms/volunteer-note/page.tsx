
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';

const noteSchema = z.object({
  accomplishment: z.string().min(10, 'Please describe what you accomplished.'),
  learning: z.string().min(10, 'Please share at least one thing you learned.'),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function VolunteerNotePage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  const onSubmit = async (data: NoteFormData) => {
    if (!user || !profile || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit a note.',
      });
      return;
    }

    // We can use the 'checkouts' collection but with a simplified structure
    const noteData = {
      userId: user.uid,
      name: profile.name,
      role: profile.role,
      avatar: user.photoURL || '',
      tasks: [{ description: data.accomplishment, status: 'Done' }],
      learning: data.learning,
      tomorrowPlan: '', // Not required for volunteers
      timestamp: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'checkouts'), noteData);
      toast({
        title: 'Note Submitted!',
        description: "Thank you for sharing your progress and learnings.",
      });
      router.push('/');
    } catch (error) {
      console.error('Error submitting volunteer note:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was a problem saving your note. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <MessageCircle className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>End-of-Day Note</CardTitle>
              <CardDescription>
                Briefly share your accomplishments and what you learned today.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accomplishment">What did you accomplish today?</Label>
              <Textarea
                id="accomplishment"
                placeholder="e.g., I helped organize the files for the RED Campaign and learned how the filing system works."
                className="min-h-[120px]"
                {...register('accomplishment')}
              />
              {errors.accomplishment && <p className="text-sm text-destructive">{errors.accomplishment.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning">What is one thing you learned?</Label>
              <Textarea
                id="learning"
                placeholder="e.g., I learned that community engagement requires a lot of patience and clear communication."
                className="min-h-[120px]"
                {...register('learning')}
              />
              {errors.learning && <p className="text-sm text-destructive">{errors.learning.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Note
            </Button>
          </CardFooter>
        </form>
       </Card>
    </div>
  );
}
