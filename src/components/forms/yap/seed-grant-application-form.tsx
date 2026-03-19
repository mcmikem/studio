
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
import { Loader2, ArrowLeft, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

const grantApplicationSchema = z.object({
  applicantName: z.string().min(3, 'Applicant name is required.'),
  projectTitle: z.string().min(5, 'Project title is required.'),
  budgetSummaryUrl: z.string().url('Must be a valid URL.').optional(),
  amountRequested: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
});

type GrantApplicationFormData = z.infer<typeof grantApplicationSchema>;

export function SeedGrantApplicationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GrantApplicationFormData>({
    resolver: zodResolver(grantApplicationSchema),
    defaultValues: {
        startDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const onSubmit = async (data: GrantApplicationFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'seed-grant-applications'), formData);
      toast({
        title: 'Application Submitted!',
        description: `Your seed grant application for "${data.projectTitle}" has been received.`,
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
            <DollarSign className="h-6 w-6" />
            Seed Grant Application
          </CardTitle>
          <CardDescription>
            Apply for a seed grant for a youth-led project.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName" className="text-xs sm:text-sm truncate">Applicant Name / Chapter Name</Label>
                  <Input id="applicantName" {...register('applicantName')} className="h-10 sm:h-11" />
                  {errors.applicantName && <p className="text-xs sm:text-sm text-destructive">{errors.applicantName.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="projectTitle" className="text-xs sm:text-sm truncate">Project Title</Label>
                  <Input id="projectTitle" {...register('projectTitle')} className="h-10 sm:h-11" />
                  {errors.projectTitle && <p className="text-xs sm:text-sm text-destructive">{errors.projectTitle.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="amountRequested" className="text-xs sm:text-sm">Amount Requested (UGX)</Label>
                <Input id="amountRequested" type="number" {...register('amountRequested')} className="h-10 sm:h-11" />
                {errors.amountRequested && <p className="text-xs sm:text-sm text-destructive">{errors.amountRequested.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="budgetSummaryUrl" className="text-xs sm:text-sm truncate">Budget Summary URL (Optional)</Label>
              <Input id="budgetSummaryUrl" {...register('budgetSummaryUrl')} placeholder="Link to Google Doc/Sheet" className="h-10 sm:h-11" />
              {errors.budgetSummaryUrl && <p className="text-xs sm:text-sm text-destructive">{errors.budgetSummaryUrl.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
               <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs sm:text-sm">Proposed Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} className="h-10 sm:h-11" />
                {errors.startDate && <p className="text-xs sm:text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs sm:text-sm">Proposed End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} className="h-10 sm:h-11" />
                {errors.endDate && <p className="text-xs sm:text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
