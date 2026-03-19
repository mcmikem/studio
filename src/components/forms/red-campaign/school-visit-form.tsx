
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, Timestamp, query, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Program } from '@/lib/types';
import { useMemo } from 'react';


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
  
  const redCampaignQuery = useMemoFirebase((db) => {
    if (!db) return null;
    return query(collection(db, 'programs'), where('title', '==', 'RED Campaign'), limit(1));
  }, [firestore]);

  const { data: redCampaignData } = useCollection<Program>(redCampaignQuery);
  const redCampaignId = redCampaignData?.[0]?.id;

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
    
    if (!redCampaignId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find the RED Campaign program ID.' });
        return;
    }

    const visitData = {
      ...data,
      programId: redCampaignId,
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
        <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 flex-wrap">
                    <Heart className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">RED Campaign School Visit M&E</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Log observations and feedback from a school visit.</CardDescription>
                    </div>
                </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolName" className="text-xs sm:text-sm truncate">School Name</Label>
                        <Input id="schoolName" {...register('schoolName')} placeholder="e.g., St. Mary's College Kisubi" className="h-10 sm:h-11" />
                        {errors.schoolName && <p className="text-xs sm:text-sm text-destructive">{errors.schoolName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dateOfVisit" className="text-xs sm:text-sm">Date of Visit</Label>
                        <Input id="dateOfVisit" type="date" {...register('dateOfVisit')} className="h-10 sm:h-11" />
                        {errors.dateOfVisit && <p className="text-xs sm:text-sm text-destructive">{errors.dateOfVisit.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="objectivesMet" className="text-xs sm:text-sm">Objectives Met</Label>
                    <Textarea id="objectivesMet" {...register('objectivesMet')} placeholder="Describe which of the visit's goals were achieved..." className="min-h-[80px] sm:min-h-[100px]" />
                    {errors.objectivesMet && <p className="text-xs sm:text-sm text-destructive">{errors.objectivesMet.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="challengesObserved" className="text-xs sm:text-sm">Challenges Observed</Label>
                    <Textarea id="challengesObserved" {...register('challengesObserved')} placeholder="e.g., Low student participation, lack of teacher support..." className="min-h-[80px] sm:min-h-[100px]" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="teacherFeedback" className="text-xs sm:text-sm">Teacher Feedback</Label>
                    <Textarea id="teacherFeedback" {...register('teacherFeedback')} placeholder="Summarize key feedback points from teachers..." className="min-h-[80px] sm:min-h-[100px]" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="studentFeedback" className="text-xs sm:text-sm">Student Feedback</Label>
                    <Textarea id="studentFeedback" {...register('studentFeedback')} placeholder="Summarize key feedback points from students..." className="min-h-[80px] sm:min-h-[100px]" />
                </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-6 lg:p-8">
                <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Visit Report
                </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}
