
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Droplets, PlusCircle, Trash2, Users, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { FormShell, FormField, FormGrid, FormSection, FormStickyFooter } from '@/components/ui/form-shell';

const participantSchema = z.object({
  name: z.string().min(3, "Name is required."),
  age: z.coerce.number().min(5, "Age is required."),
  class: z.string().optional(),
});

const mhmTrainingSchema = z.object({
  session: z.string().min(3, 'Session title is required.'),
  date: z.string().min(1, 'Date is required.'),
  participants: z.array(participantSchema).min(1, 'At least one participant is required.'),
});

type MhmTrainingFormData = z.infer<typeof mhmTrainingSchema>;

export function MhmTrainingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MhmTrainingFormData>({
    resolver: zodResolver(mhmTrainingSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      participants: [{ name: '', age: 0, class: '' }]
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants"
  });

  const onSubmit = async (data: MhmTrainingFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const validParticipants = data.participants.filter(p => p.name.trim() !== '');
    if (validParticipants.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter details for at least one participant.' });
        return;
    }

    const formData = {
      ...data,
      participants: validParticipants,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'mhm-trainings'), formData);
      toast({
        title: 'Training Logged!',
        description: `The MHM training session has been recorded.`,
      });
      reset();
      router.push('/meal');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-8 pb-32">
        <PageHeader 
            icon={GraduationCap}
            title="MHM Training Report"
            description="Document attendance and impact of Menstrual Health Management education sessions."
            breadcrumbs={[
                { name: 'Xperience', href: '/school-xperience' },
                { name: 'RED Campaign', href: '/meal/data/red-campaign' },
                { name: 'Log Training', href: '/meal/red-campaign/mhm-training' }
            ]}
        />

        <FormShell onSubmit={handleSubmit(onSubmit)}>
            <FormSection title="Session Details" defaultOpen={true}>
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <FormGrid columns={2}>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Session Title *</Label>
                                <Input 
                                    {...register('session')} 
                                    placeholder="e.g., Menstrual Hygiene 101" 
                                    className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all text-omuto-navy"
                                />
                                {errors.session && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2">{errors.session.message}</p>}
                            </FormField>
                            <FormField>
                                <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Date of Training *</Label>
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

            <FormSection title="Attendance Registry" defaultOpen={true} icon={Users}>
                <div className="space-y-4">
                    <div className="hidden sm:block overflow-hidden border-2 rounded-[2rem]">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Name</TableHead>
                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-24">Age</TableHead>
                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-24">Class</TableHead>
                                    <TableHead className="px-6 py-4 text-right w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id} className="border-b last:border-0">
                                        <TableCell className="p-2 px-6">
                                            <Input {...register(`participants.${index}.name`)} placeholder="Full Name" className="h-10 border-0 bg-transparent focus:ring-0 font-bold" />
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input type="number" {...register(`participants.${index}.age`)} placeholder="Age" className="h-10 border-0 bg-transparent focus:ring-0 font-bold tabular-nums" />
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input {...register(`participants.${index}.class`)} placeholder="P.7" className="h-10 border-0 bg-transparent focus:ring-0 font-bold" />
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="text-omuto-red hover:bg-omuto-red/10 h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="sm:hidden space-y-4">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="border-2 rounded-3xl overflow-hidden bg-muted/10">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center border-b pb-4 mb-4 border-black/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participant #{index + 1}</span>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="text-omuto-red h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <FormField>
                                        <Input {...register(`participants.${index}.name`)} placeholder="Full Name" className="h-12 rounded-xl border-2 border-black/5 font-bold px-4" />
                                    </FormField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="number" {...register(`participants.${index}.age`)} placeholder="Age" className="h-12 rounded-xl border-2 border-black/5 font-bold px-4" />
                                        <Input {...register(`participants.${index}.class`)} placeholder="Class" className="h-12 rounded-xl border-2 border-black/5 font-bold px-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => append({ name: '', age: 0, class: '' })} 
                        className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" /> Add Participant Row
                    </Button>
                    {errors.participants && <p className="text-[10px] font-bold text-omuto-red uppercase tracking-widest mt-2 px-4">{errors.participants.message}</p>}
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
                            <><ClipboardCheck className="mr-2 h-5 w-5" /> Save Training Report</>
                        )}
                    </Button>
                </div>
            </FormStickyFooter>
        </FormShell>
    </div>
  );
}
