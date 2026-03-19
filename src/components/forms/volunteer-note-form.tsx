
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

export function VolunteerNoteForm() {
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
      tasks: [{ description: data.accomplishment, status: 'Done' as const }],
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
       <Card className="w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl truncate">End-of-Day Note</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Share your accomplishments and learnings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accomplishment" className="text-xs sm:text-sm font-medium">What did you accomplish?</Label>
              <Textarea
                id="accomplishment"
                placeholder="e.g., I helped organize files for RED Campaign..."
                className="min-h-[80px] sm:min-h-[100px] text-sm"
                {...register('accomplishment')}
              />
              {errors.accomplishment && <p className="text-xs text-destructive">{errors.accomplishment.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning" className="text-xs sm:text-sm font-medium">What did you learn?</Label>
              <Textarea
                id="learning"
                placeholder="e.g., I learned that community engagement requires patience..."
                className="min-h-[80px] sm:min-h-[100px] text-sm"
                {...register('learning')}
              />
              {errors.learning && <p className="text-xs text-destructive">{errors.learning.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 pt-0">
            <Button type="submit" disabled={isSubmitting} className="w-full h-11 sm:h-12">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Note
            </Button>
          </CardFooter>
        </form>
       </Card>
   );
}
