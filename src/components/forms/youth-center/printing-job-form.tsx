
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PrintingJobFormSchema,
  type PrintingJobFormData,
  type PrintingJob,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { useMemo, useEffect } from 'react';

interface PrintingJobFormProps {
  job?: PrintingJob | null;
  onSuccess: () => void;
}

export function PrintingJobForm({ job, onSuccess }: PrintingJobFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditMode = !!job;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PrintingJobFormData>({
    resolver: zodResolver(PrintingJobFormSchema),
    defaultValues: isEditMode ? {
        ...job,
        jobDate: format(new Date(job.jobDate), 'yyyy-MM-dd')
    } : {
      jobDate: format(new Date(), 'yyyy-MM-dd'),
      paymentStatus: 'Unpaid',
      pages_bw: 0,
      pages_color: 0,
      totalAmount: 0,
    },
  });

  const pagesBw = watch('pages_bw');
  const pagesColor = watch('pages_color');

  // Assuming fixed prices per page for simplicity
  const priceBw = 100;
  const priceColor = 500;

  useEffect(() => {
    const total = (pagesBw * priceBw) + (pagesColor * priceColor);
    setValue('totalAmount', total);
  }, [pagesBw, pagesColor, setValue, priceBw, priceColor]);

  const onSubmit = async (data: PrintingJobFormData) => {
    if (!firestore || !user) return;

    const submissionData = {
      ...data,
      jobDate: data.jobDate,
      operatorId: user.uid,
    };

    if (isEditMode && job) {
        await updateDocumentNonBlocking(doc(firestore, 'printing-jobs', job.id), submissionData);
        toast({ title: "Job updated successfully" });
    } else {
        const fullData = {
            ...submissionData,
            jobNumber: `PRINT-${Date.now()}`,
            createdAt: serverTimestamp(),
        };
        await addDocumentNonBlocking(collection(firestore, 'printing-jobs'), fullData);
        toast({ title: 'Printing job created successfully' });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input id="clientName" {...register('clientName')} className="h-10 sm:h-11" />
          {errors.clientName && <p className="text-xs sm:text-sm text-destructive">
  {errors.clientName && (errors.clientName as any).message}
</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobDate">Job Date</Label>
          <Input id="jobDate" type="date" {...register('jobDate')} className="h-10 sm:h-11" />
          {errors.jobDate && <p className="text-xs sm:text-sm text-destructive">
  {errors.jobDate && (errors.jobDate as any).message}
</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>B&W Pages</Label>
            <Input type="number" {...register('pages_bw')} className="h-10 sm:h-11" />
          </div>
           <div className="space-y-2">
            <Label>Color Pages</Label>
            <Input type="number" {...register('pages_color')} className="h-10 sm:h-11" />
          </div>
      </div>
       <div className="space-y-2">
        <Label>Total Amount</Label>
        <Input type="number" {...register('totalAmount')} readOnly className="h-10 sm:h-11" />
      </div>
       <div className="space-y-2">
        <Label htmlFor="paymentStatus">Payment Status</Label>
        <Controller name="paymentStatus" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-10 sm:h-11"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem></SelectContent></Select>
        )}/>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="h-10 sm:h-11 w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Create Job'}
        </Button>
      </DialogFooter>
    </form>
  );
}
