
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const chapterSchema = z.object({
  chapterName: z.string().min(3, 'Chapter name is required.'),
  location: z.string().min(3, 'Location is required.'),
  leader: z.string().min(3, 'Leader name is required.'),
  membersCount: z.coerce.number().min(1, 'Number of members is required.'),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

export function ChapterRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
  });

  const onSubmit = async (data: ChapterFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'yap-chapters'), formData);
      toast({
        title: 'Chapter Registered!',
        description: `The ${data.chapterName} has been successfully registered.`,
      });
      reset();
      router.push('/meal/yap');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl">
            <Users className="h-6 w-6" />
            YAP Chapter Registration
          </CardTitle>
          <CardDescription>
            Register a new Youth Action Pathway chapter.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="space-y-2">
              <Label htmlFor="chapterName" className="text-xs sm:text-sm truncate">Chapter Name</Label>
              <Input id="chapterName" {...register('chapterName')} className="h-10 sm:h-11" />
              {errors.chapterName && <p className="text-xs sm:text-sm text-destructive">{errors.chapterName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs sm:text-sm truncate">Location (e.g., Village, Sub-county)</Label>
              <Input id="location" {...register('location')} className="h-10 sm:h-11" />
              {errors.location && <p className="text-xs sm:text-sm text-destructive">{errors.location.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="leader" className="text-xs sm:text-sm truncate">Chapter Leader's Name</Label>
                <Input id="leader" {...register('leader')} className="h-10 sm:h-11" />
                {errors.leader && <p className="text-xs sm:text-sm text-destructive">{errors.leader.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="membersCount" className="text-xs sm:text-sm">Number of Members</Label>
                <Input id="membersCount" type="number" {...register('membersCount')} className="h-10 sm:h-11" />
                {errors.membersCount && <p className="text-xs sm:text-sm text-destructive">{errors.membersCount.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Chapter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
