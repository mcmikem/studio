
'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
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
import { Loader2, FilePlus2, PlusCircle, Trash2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { createAlert } from '@/ai/flows/create-alert-flow';

const expenseItemSchema = z.object({
  description: z.string().min(3, 'Item description is required.'),
  category: z.enum(["Transport", "Materials", "Food", "Airtime", "Other"]),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
});

const expenseSchema = z.object({
  title: z.string().min(3, 'Please provide a title for the report.'),
  type: z.enum(["Requisition", "Reimbursement"]),
  date: z.string().min(1, 'Date is required.'),
  items: z.array(expenseItemSchema).min(1, 'Please add at least one expense item.'),
  totalAmount: z.number().min(1, 'Total amount must be greater than zero.'),
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
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: 'Reimbursement',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      items: [{ description: '', category: 'Transport', amount: 0 }],
      totalAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = useWatch({ control, name: 'items' });
  
  const totalAmount = React.useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [watchedItems]);

  React.useEffect(() => {
    setValue('totalAmount', totalAmount);
  }, [totalAmount, setValue]);

  const onSubmit = (data: ExpenseFormData) => {
    if (!firestore || !user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit an expense report.',
      });
      return;
    }
    
    // Filter out empty items before submission
    const finalItems = data.items.filter(item => item.description.trim() !== '' && item.amount > 0);
    
    if (finalItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty Report',
        description: 'Please add at least one valid expense item.',
      });
      return;
    }

    const finalTotal = finalItems.reduce((sum, item) => sum + item.amount, 0);

    const expenseData = {
      ...data,
      items: finalItems,
      totalAmount: finalTotal,
      userId: user.uid,
      userName: profile.name,
      status: 'Pending' as const,
      createdAt: serverTimestamp(),
    };

    const expensesCollection = collection(firestore, 'expenses');

    addDocumentNonBlocking(expensesCollection, expenseData)
        .then(docRef => {
            const alertMessage = `New expense report from ${profile.name} for "${data.title}" requires your approval.`;
            
            // This is a fire-and-forget call to the AI flow
            if (docRef) {
                createAlert({
                    type: 'Reminder',
                    message: alertMessage,
                    priority: 'Medium',
                    action: `/management/expenses?highlight=${docRef.id}`,
                    creatorId: user.uid,
                });
            }

            toast({
                title: 'Expense Report Submitted!',
                description: `Your report has been sent for approval.`,
            });

            reset({
                type: 'Reimbursement',
                date: format(new Date(), 'yyyy-MM-dd'),
                title: '',
                items: [{ description: '', category: 'Transport', amount: 0 }],
                totalAmount: 0,
            });
        })
        .catch(e => {
            console.error(e);
            // The global error emitter will catch permission errors, but this is a fallback.
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: 'Could not save your expense report. Check permissions and try again.',
            });
        });
  };


  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input id="title" placeholder="e.g., Mpigi Field Visit" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{`${errors.title.message}`}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Expense Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select expense type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reimbursement">Reimbursement (Claiming money spent)</SelectItem>
                      <SelectItem value="Requisition">Requisition (Requesting money to spend)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-sm text-destructive">{`${errors.type.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="date">Date of Expense</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{`${errors.date.message}`}</p>}
            </div>
          </div>
          
          <Separator />

          <div>
             <h3 className="text-lg font-semibold mb-2">Expense Items</h3>
             <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 p-3 border rounded-md relative">
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 sm:hidden"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Item</span>
                        </Button>
                        <div className="space-y-2 sm:col-span-1">
                            <Label htmlFor={`items.${index}.description`}>Description</Label>
                            <Input id={`items.${index}.description`} placeholder="e.g., Boda to Nindye SS" {...register(`items.${index}.description`)} />
                            {errors.items?.[index]?.description && <p className="text-sm text-destructive">{`${errors.items?.[index]?.description?.message}`}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`items.${index}.category`}>Category</Label>
                             <Controller
                              name={`items.${index}.category`}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger id={`items.${index}.category`}><SelectValue placeholder="Category..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Transport">Transport</SelectItem>
                                    <SelectItem value="Materials">Materials</SelectItem>
                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Airtime">Airtime</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`items.${index}.amount`}>Amount</Label>
                            <Input id={`items.${index}.amount`} type="number" placeholder="10000" {...register(`items.${index}.amount`)} />
                             {errors.items?.[index]?.amount && <p className="text-sm text-destructive">{`${errors.items?.[index]?.amount?.message}`}</p>}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex self-end"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Item</span>
                        </Button>
                    </div>
                ))}
             </div>
             {errors.items && <p className="text-sm text-destructive mt-2">{`${errors.items.message}`}</p>}
             <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: '', category: 'Transport', amount: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
            </Button>
          </div>

            <Separator />
            <div className="flex justify-end items-center gap-4 text-lg font-bold p-2 bg-muted rounded-md">
                <span>Total Amount:</span>
                <span>{new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(totalAmount)}</span>
            </div>
             {errors.totalAmount && <p className="text-sm text-destructive text-right">{`${errors.totalAmount.message}`}</p>}


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

    
