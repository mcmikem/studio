
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
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Program } from '@/lib/types';
import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { FormShell, FormField, FormGrid, FormSection, FormStickyFooter } from '@/components/ui/form-shell';


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
    <div className="container max-w-2xl py-8 space-y-8 pb-32">
        <PageHeader 
            icon={Heart}
            title="School Visit M&E"
            description="Log observations and critical feedback from field visits to ensure program excellence."
            breadcrumbs={[
                { name: 'Xperience', href: '/school-xperience' },
                { name: 'RED Campaign', href: '/meal/data/red-campaign' },
                { name: 'Log Visit', href: '/meal/red-campaign/school-visit' }
            ]}
        />

        <FormShell onSubmit={handleSubmit(onSubmit)}>
            <FormSection title="Core Information" defaultOpen={true}>
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <FormGrid columns={2}>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">School Name *</Label>
                                <Input 
                                    {...register('schoolName')} 
                                    placeholder="e.g., St. Mary's College" 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy"
                                />
                                {errors.schoolName && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.schoolName.message}</p>}
                            </FormField>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Date of Visit *</Label>
                                <Input 
                                    type="date" 
                                    {...register('dateOfVisit')} 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy tabular-nums"
                                />
                                {errors.dateOfVisit && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.dateOfVisit.message}</p>}
                            </FormField>
                        </FormGrid>
                    </CardContent>
                </Card>
            </FormSection>

            <FormSection title="Field Observations" defaultOpen={true}>
                <div className="space-y-6">
                    <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Primary Objectives Met *</Label>
                                <Textarea 
                                    {...register('objectivesMet')} 
                                    placeholder="Describe which goals were achieved during this visit..." 
                                    className="min-h-[120px] rounded-3xl border-2 border-black/5 p-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy leading-relaxed"
                                />
                                {errors.objectivesMet && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.objectivesMet.message}</p>}
                            </FormField>

                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Critical Challenges</Label>
                                <Textarea 
                                    {...register('challengesObserved')} 
                                    placeholder="Obstacles, resource gaps, or systemic issues observed..." 
                                    className="min-h-[100px] rounded-3xl border-2 border-black/5 p-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy leading-relaxed"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <FormGrid columns={2}>
                        <Card className="border-2 shadow-lg rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-6 pb-0">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary italic">Teacher Voice</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea 
                                    {...register('teacherFeedback')} 
                                    placeholder="Direct quotes or summary..." 
                                    className="min-h-[100px] rounded-2xl border-0 p-0 font-bold bg-transparent focus:ring-0 text-omuto-navy text-sm"
                                />
                            </CardContent>
                        </Card>
                        <Card className="border-2 shadow-lg rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-6 pb-0">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-pink-500 italic">Student Voice</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea 
                                    {...register('studentFeedback')} 
                                    placeholder="Direct quotes or summary..." 
                                    className="min-h-[100px] rounded-2xl border-0 p-0 font-bold bg-transparent focus:ring-0 text-omuto-navy text-sm"
                                />
                            </CardContent>
                        </Card>
                    </FormGrid>
                </div>
            </FormSection>

            <FormStickyFooter>
                <div className="container max-w-2xl flex gap-4">
                    <Button variant="outline" type="button" asChild className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest border-2">
                        <Link href="/meal/red-campaign">Cancel</Link>
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="btn-omuto flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Synchronizing...</>
                        ) : (
                            <><Heart className="mr-2 h-5 w-5" /> Finalize Report</>
                        )}
                    </Button>
                </div>
            </FormStickyFooter>
        </FormShell>
    </div>
  );
}
