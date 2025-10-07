'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FilePlus2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';


const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  description: z.string().min(5, 'Please provide a detailed description.'),
  category: z.enum(["Transport", "Materials", "Food", "Airtime", "Other"]),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export function ExpenseReportForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Transport',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (!firestore || !user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit an expense report.',
      });
      return;
    }

    const expenseData = {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)),
      userId: user.uid,
      userName: profile.name,
      status: 'Pending' as const,
      createdAt: serverTimestamp(),
    };

    const expensesCollection = collection(firestore, 'expenses');
    try {
      await addDocumentNonBlocking(expensesCollection, expenseData);
      toast({
        title: 'Expense Report Submitted!',
        description: 'Your report has been sent for approval.',
      });
      reset();
    } catch(e) {
      // The non-blocking function will emit the detailed error.
      // We can show a generic toast here if we want, but the console will have the details.
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Could not save your expense report. Please check your permissions and try again.',
      });
    }
  };


  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="date">Date of Expense</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{`${errors.date.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input id="amount" type="number" placeholder="e.g., 25000" {...register('amount')} />
                {errors.amount && <p className="text-sm text-destructive">{`${errors.amount.message}`}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
             <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Food">Food & Refreshments</SelectItem>
                    <SelectItem value="Airtime">Airtime/Data</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-destructive">{`${errors.category.message}`}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the expense..."
              {...register('description')}
            />
            {errors.description && <p className="text-sm text-destructive">{`${errors.description.message}`}</p>}
          </div>
           <Button
                className="w-full"
                type="submit"
                disabled={isSubmitting}
                size="lg"
            >
                {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                <FilePlus2 className="mr-2 h-5 w-5" />
                )}
                Submit for Approval
            </Button>
        </div>
      </form>
  );
}
