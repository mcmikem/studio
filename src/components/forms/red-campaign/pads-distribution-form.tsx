'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Droplets, Package, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { FormShell, FormField, FormGrid, FormSection, FormStickyFooter } from '@/components/ui/form-shell';
import { createSystemAlert } from '@/lib/notifications';

const padsDistributionSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  school: z.string().min(3, 'School/Community name is required.'),
  numberOfPads: z.coerce.number().min(1, 'Number of pads must be at least 1.'),
  girlsReached: z.coerce.number().min(1, 'Number of girls must be at least 1.'),
  notes: z.string().optional(),
});

type PadsDistributionFormData = z.infer<typeof padsDistributionSchema>;

export function PadsDistributionForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PadsDistributionFormData>({
    resolver: zodResolver(padsDistributionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: PadsDistributionFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const formData = {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'pads-distributions'), formData)
        .then(async () => {
             await createSystemAlert(firestore, {
                type: 'Info',
                priority: 'Low',
                message: `${profile?.name || user?.email} logged a pads distribution for ${data.school} (${data.numberOfPads} pads)`,
                creatorId: user?.uid || 'system',
                action: `/meal/red-campaign`
            });
            toast({ title: "Distribution Saved!", description: `Recorded ${data.numberOfPads} pads for ${data.school}.` });
            reset();
            router.push('/meal/red-campaign');
        });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-8 pb-32">
        <PageHeader 
            icon={Package}
            title="Pads Distribution Log"
            description="Track the logistics and impact of sanitary pad distributions across partner schools."
            breadcrumbs={[
                { name: 'Xperience', href: '/school-xperience' },
                { name: 'RED Campaign', href: '/meal/data/red-campaign' },
                { name: 'Log Distribution', href: '/meal/red-campaign/pads-distribution' }
            ]}
        />

        <FormShell onSubmit={handleSubmit(onSubmit)} hideDefaultButtons={true}>
            <FormSection title="Distribution Details" defaultOpen={true}>
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <FormGrid columns={2}>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">School / Community *</Label>
                                <Input 
                                    {...register('school')} 
                                    placeholder="e.g., Kyebando Community" 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy"
                                />
                                {errors.school && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.school.message}</p>}
                            </FormField>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Date *</Label>
                                <Input 
                                    type="date" 
                                    {...register('date')} 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy tabular-nums"
                                />
                                {errors.date && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.date.message}</p>}
                            </FormField>
                        </FormGrid>
                    </CardContent>
                </Card>
            </FormSection>

            <FormSection title="Impact Metrics" defaultOpen={true}>
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <FormGrid columns={2}>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Pads Distributed *</Label>
                                <Input 
                                    type="number" 
                                    {...register('numberOfPads')} 
                                    placeholder="0" 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy tabular-nums"
                                />
                                {errors.numberOfPads && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.numberOfPads.message}</p>}
                            </FormField>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Girls Rereached *</Label>
                                <Input 
                                    type="number" 
                                    {...register('girlsReached')} 
                                    placeholder="0" 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy tabular-nums"
                                />
                                {errors.girlsReached && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.girlsReached.message}</p>}
                            </FormField>
                        </FormGrid>

                        <FormField>
                            <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Additional Notes</Label>
                            <Textarea 
                                {...register('notes')} 
                                placeholder="Coordinating teachers, distribution environment, or special cases..." 
                                className="min-h-[120px] rounded-3xl border-2 border-black/5 p-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy leading-relaxed"
                            />
                        </FormField>
                    </CardContent>
                </Card>
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
                            <><Droplets className="mr-2 h-5 w-5" /> Save Distribution</>
                        )}
                    </Button>
                </div>
            </FormStickyFooter>
        </FormShell>
    </div>
  );
}
