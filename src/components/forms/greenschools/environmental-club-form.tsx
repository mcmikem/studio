'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const environmentalClubSchema = z.object({
  schoolName: z.string().min(3, 'School name is required.'),
  clubName: z.string().min(3, 'Club name is required.'),
  membersCount: z.coerce.number().min(1, 'Please enter the number of members.'),
  leaderName: z.string().min(3, 'Leader name is required.'),
  leaderContact: z.string().optional(),
});

type EnvironmentalClubFormData = z.infer<typeof environmentalClubSchema>;

export function EnvironmentalClubForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EnvironmentalClubFormData>({
    resolver: zodResolver(environmentalClubSchema),
  });

  const onSubmit = async (data: EnvironmentalClubFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit this form.' });
      return;
    }

    const formData = {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'environmental-clubs'), formData);
      toast({
        title: 'Club Registered!',
        description: `The ${data.clubName} at ${data.schoolName} has been successfully registered.`,
      });
      reset();
      router.push('/meal');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild className="rounded-xl">
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <Users className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                Environmental <span className="text-omuto-red">Club</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                GreenSchools Registration Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" {...register('schoolName')} className="h-10 sm:h-11" />
              {errors.schoolName && <p className="text-xs sm:text-sm text-destructive">{errors.schoolName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name</Label>
              <Input id="clubName" {...register('clubName')} className="h-10 sm:h-11" />
              {errors.clubName && <p className="text-xs sm:text-sm text-destructive">{errors.clubName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="membersCount">Number of Members</Label>
              <Input id="membersCount" type="number" {...register('membersCount')} className="h-10 sm:h-11" />
              {errors.membersCount && <p className="text-xs sm:text-sm text-destructive">{errors.membersCount.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="leaderName">Club Leader Name (Student)</Label>
                    <Input id="leaderName" {...register('leaderName')} className="h-10 sm:h-11" />
                    {errors.leaderName && <p className="text-xs sm:text-sm text-destructive">{errors.leaderName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="leaderContact">Leader's Contact (Optional)</Label>
                    <Input id="leaderContact" {...register('leaderContact')} className="h-10 sm:h-11" />
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Club
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
