
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';

const schoolVisitSchema = z.object({
  schoolName: z.string().min(3, "School name is required."),
  dateOfVisit: z.string().min(1, "Date of visit is required."),
  objectivesMet: z.string().min(10, "Please describe the objectives met."),
  challengesObserved: z.string().optional(),
  teacherFeedback: z.string().optional(),
  studentFeedback: z.string().optional(),
});

type VisitFormData = z.infer<typeof schoolVisitSchema>;

export function SchoolVisitForm() {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VisitFormData>({
    resolver: zodResolver(schoolVisitSchema),
    defaultValues: {
        dateOfVisit: format(new Date(), 'yyyy-MM-dd')
    }
  });


  const onSubmit = async (data: VisitFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a report.' });
      return;
    }

    const visitData = {
      ...data,
      programId: 'RED Campaign', // Hardcoded for this specific form
      userId: user.uid,
      userName: profile.name,
      createdAt: serverTimestamp() as Timestamp,
    };
    
    await addDocumentNonBlocking(collection(firestore, 'school-visits'), visitData)
        .then(() => {
            toast({ title: "Visit Report Saved!", description: `The report for ${data.schoolName} has been logged.` });
            router.push('/meal/red-campaign');
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the visit report.' });
        });
  };

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href="/meal/red-campaign">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to RED Campaign Hub
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Heart className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>RED Campaign School Visit M&E</CardTitle>
                        <CardDescription>Log observations and feedback from a school visit.</CardDescription>
                    </div>
                </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" {...register('schoolName')} placeholder="e.g., St. Mary's College Kisubi" />
                        {errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dateOfVisit">Date of Visit</Label>
                        <Input id="dateOfVisit" type="date" {...register('dateOfVisit')} />
                        {errors.dateOfVisit && <p className="text-sm text-destructive">{errors.dateOfVisit.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="objectivesMet">Objectives Met</Label>
                    <Textarea id="objectivesMet" {...register('objectivesMet')} placeholder="Describe which of the visit's goals were achieved..." className="min-h-[100px]" />
                    {errors.objectivesMet && <p className="text-sm text-destructive">{errors.objectivesMet.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="challengesObserved">Challenges Observed</Label>
                    <Textarea id="challengesObserved" {...register('challengesObserved')} placeholder="e.g., Low student participation, lack of teacher support..." className="min-h-[100px]" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="teacherFeedback">Teacher Feedback</Label>
                    <Textarea id="teacherFeedback" {...register('teacherFeedback')} placeholder="Summarize key feedback points from teachers..." className="min-h-[100px]" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="studentFeedback">Student Feedback</Label>
                    <Textarea id="studentFeedback" {...register('studentFeedback')} placeholder="Summarize key feedback points from students..." className="min-h-[100px]" />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Visit Report
                </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}
