
'use client';

import { Suspense, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileText, ArrowLeft, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Beneficiary } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';

const endlineSchema = z.object({
  beneficiaryId: z.string().min(1, 'Please select a beneficiary.'),
  surveyDate: z.string().min(1, 'Date is required.'),
  skillLevel: z.coerce.number().min(1).max(10),
  monthlyIncome: z.coerce.number().optional(),
  changesNoticed: z.string().min(10, 'Please describe the changes noticed.'),
  satisfaction: z.coerce.number().min(1).max(5),
});

type EndlineFormData = z.infer<typeof endlineSchema>;

function StarRating({ value, onValueChange }: { value: number, onValueChange: (value: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={`cursor-pointer h-8 w-8 transition-colors ${value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                    onClick={() => onValueChange(star)}
                />
            ))}
        </div>
    )
}

function EndlineSurveyForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'beneficiaries'), orderBy('name'));
  }, [firestore]);
  const { data: beneficiaries, isLoading: isLoadingBeneficiaries } = useCollection<Beneficiary>(beneficiariesQuery);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EndlineFormData>({
    resolver: zodResolver(endlineSchema),
    defaultValues: {
      surveyDate: format(new Date(), 'yyyy-MM-dd'),
      skillLevel: 5,
      satisfaction: 4,
    },
  });

  const satisfactionValue = watch('satisfaction');

  const onSubmit = async (data: EndlineFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const record = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'endline-surveys'), record);
      toast({
        title: 'Endline Survey Saved!',
        description: `The "after" data has been logged.`,
      });
      reset();
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
              <FileText className="h-6 w-6" />
              Endline Survey Form
            </CardTitle>
            <CardDescription>
              Capture the "after the program" status for a beneficiary.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="beneficiaryId">Beneficiary</Label>
                    {isLoadingBeneficiaries ? <Skeleton className="h-10 w-full" /> : (
                        <Controller
                            name="beneficiaryId"
                            control={control}
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="beneficiaryId">
                                    <SelectValue placeholder="Select a beneficiary..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {beneficiaries?.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                    )}
                    {errors.beneficiaryId && <p className="text-sm text-destructive">{errors.beneficiaryId.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="surveyDate">Survey Date</Label>
                    <Input id="surveyDate" type="date" {...register('surveyDate')} />
                    {errors.surveyDate && <p className="text-sm text-destructive">{errors.surveyDate.message}</p>}
                </div>
              </div>

               <div className="space-y-2">
                 <Label>Skill Level After Program (1-10)</Label>
                 <Controller
                    name="skillLevel"
                    control={control}
                    render={({ field }) => (
                       <div className="flex items-center gap-4">
                         <Slider
                            min={1} max={10} step={1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                         />
                         <span className="font-bold w-12 text-center">{field.value}</span>
                       </div>
                    )}
                 />
                 {errors.skillLevel && <p className="text-sm text-destructive">{errors.skillLevel.message}</p>}
              </div>

               <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Current Monthly Income (UGX, if applicable)</Label>
                <Input id="monthlyIncome" type="number" {...register('monthlyIncome')} placeholder="e.g., 150000" />
              </div>

               <div className="space-y-2">
                <Label htmlFor="changesNoticed">Changes Noticed</Label>
                <Textarea id="changesNoticed" {...register('changesNoticed')} placeholder="Describe the main changes observed in the beneficiary's life or skills." />
                {errors.changesNoticed && <p className="text-sm text-destructive">{errors.changesNoticed.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Program Satisfaction (1-5)</Label>
                <Controller
                    name="satisfaction"
                    control={control}
                    render={({ field }) => (
                       <StarRating value={field.value} onValueChange={field.onChange} />
                    )}
                 />
                 {errors.satisfaction && <p className="text-sm text-destructive">{errors.satisfaction.message}</p>}
              </div>
              
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Endline Survey
              </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}

export default function EndlineSurveyPage() {
    return (
        <Suspense>
            <EndlineSurveyForm />
        </Suspense>
    )
}
