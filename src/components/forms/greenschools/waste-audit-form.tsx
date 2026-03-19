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
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

const wasteAuditSchema = z.object({
  schoolName: z.string().min(3, 'School name is required.'),
  date: z.string().min(1, 'Date is required.'),
  wasteSources: z.string().min(10, 'Please describe the main sources of waste.'),
  disposalMethod: z.string().min(5, 'Please describe the current disposal method.'),
  recommendations: z.string().optional(),
});

type WasteAuditFormData = z.infer<typeof wasteAuditSchema>;

export function WasteAuditForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WasteAuditFormData>({
    resolver: zodResolver(wasteAuditSchema),
    defaultValues: {
        date: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const onSubmit = async (data: WasteAuditFormData) => {
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
      await addDocumentNonBlocking(collection(firestore, 'waste-audits'), formData);
      toast({
        title: 'Waste Audit Logged!',
        description: `The audit for ${data.schoolName} has been successfully recorded.`,
      });
      reset();
      router.push('/meal');
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            Waste Audit Form
          </CardTitle>
          <CardDescription>
            Conduct and log a waste audit for a school in the GreenSchools program.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" {...register('schoolName')} className="h-10 sm:h-11" />
                {errors.schoolName && <p className="text-xs sm:text-sm text-destructive">{errors.schoolName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date of Audit</Label>
                <Input id="date" type="date" {...register('date')} className="h-10 sm:h-11" />
                {errors.date && <p className="text-xs sm:text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wasteSources">Main Sources of Waste Found</Label>
              <Textarea id="wasteSources" {...register('wasteSources')} placeholder="e.g., Plastic bottles, food leftovers, paper..." className="min-h-[80px] sm:min-h-[100px]" />
              {errors.wasteSources && <p className="text-xs sm:text-sm text-destructive">{errors.wasteSources.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="disposalMethod">Current Method of Waste Disposal</Label>
              <Textarea id="disposalMethod" {...register('disposalMethod')} placeholder="e.g., Open pit burning, collection by local service..." className="min-h-[80px] sm:min-h-[100px]" />
              {errors.disposalMethod && <p className="text-xs sm:text-sm text-destructive">{errors.disposalMethod.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations (Optional)</Label>
              <Textarea id="recommendations" {...register('recommendations')} placeholder="e.g., Introduce separation bins, start a compost pit..." className="min-h-[80px] sm:min-h-[100px]" />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Waste Audit
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
