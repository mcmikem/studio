

'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking, 
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, getDocs, where } from 'firebase/firestore';
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
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import type { Expense, User, Project } from '@/lib/types';


const expenseItemSchema = z.object({
  description: z.string().min(3, 'Item description is required.'),
  category: z.enum(["Transport", "Rent", "Office Dev't", "Projects", "Stationery", "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy", "Phone", "Food", "Mobile Money Charges", "IGA Expense", "Allowances and stipends", "Kibanja", "Professional Services", "community support", "miscellaneous", "Withdraw"]),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
});

const expenseSchema = z.object({
  title: z.string().min(3, 'Please provide a title for the report.'),
  type: z.enum(["Requisition", "Reimbursement"]),
  date: z.string().min(1, 'Date is required.'),
  projectId: z.string().optional(),
  items: z.array(expenseItemSchema).min(1, 'Please add at least one expense item.'),
  totalAmount: z.number().min(1, 'Total amount must be greater than zero.'),
  // New fields for submitting on behalf of others
  submittedFor: z.string().optional(),
  otherUserName: z.string().optional(),
}).refine(data => {
    if ((data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') && !data.otherUserName) {
        return false;
    }
    return true;
}, {
    message: "Please specify the name for the selected role.",
    path: ["otherUserName"],
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseReportFormProps {
    expense?: Expense | null;
    onSuccess?: () => void;
}

export function ExpenseReportForm({ expense, onSuccess }: ExpenseReportFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'projects'), orderBy('name')) : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const isEditMode = !!expense;
  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canSubmitForOthers = profile && financeRoles.includes(profile.role);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEditMode && expense ? {
        ...expense,
        date: formatDateSafe(expense.date, 'iso'),
        submittedFor: expense.userId
    } : {
      type: 'Reimbursement',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      items: [{ description: '', category: 'Transport', amount: 0 }],
      totalAmount: 0,
      submittedFor: user?.uid
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = useWatch({ control, name: 'items' });
  const submittedForSelection = useWatch({ control, name: 'submittedFor' });
  
  const totalAmount = React.useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [watchedItems]);

  React.useEffect(() => {
    setValue('totalAmount', totalAmount);
  }, [totalAmount, setValue]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!firestore || !user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit an expense report.',
      });
      return;
    }
    
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

    let expenseUserId = user.uid;
    let expenseUserName = profile.name;

    if (canSubmitForOthers && data.submittedFor) {
        if (data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') {
            expenseUserId = data.submittedFor.toLowerCase(); // e.g. 'volunteer'
            expenseUserName = data.otherUserName || `${data.submittedFor} (unnamed)`;
        } else {
            const selectedUser = users?.find(u => u.id === data.submittedFor);
            if (selectedUser) {
                expenseUserId = selectedUser.id;
                expenseUserName = selectedUser.name;
            }
        }
    }
    
    const selectedProject = projects?.find(p => p.id === data.projectId);

    const expenseData: Partial<Expense> = {
      title: data.title,
      type: data.type,
      date: data.date,
      items: finalItems,
      totalAmount: finalTotal,
      userId: expenseUserId,
      userName: expenseUserName,
    };
    
    if (selectedProject) {
        expenseData.projectId = selectedProject.id;
        expenseData.projectName = selectedProject.name;
    }


    try {
        if (isEditMode && expense) {
            const docRef = doc(firestore, 'expenses', expense.id);
            await updateDocumentNonBlocking(docRef, expenseData);
            toast({
                title: 'Expense Report Updated!',
                description: `Your report has been successfully modified.`,
            });
        } else {
            const newExpenseData = {
                ...expenseData,
                status: 'Pending' as const,
                createdAt: serverTimestamp(),
            };
            const expensesCollection = collection(firestore, 'expenses');
            const docRef = await addDocumentNonBlocking(expensesCollection, newExpenseData);
            
            toast({
                title: 'Expense Report Submitted!',
                description: `Your report has been sent for approval.`,
            });

            const managementUsersQuery = query(collection(firestore, 'users'), where('role', 'in', ['Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager']));
            const managementSnapshot = await getDocs(managementUsersQuery);
            const managerIds = managementSnapshot.docs.map(d => d.id).filter(id => id !== user.uid);

            if (managerIds.length > 0) {
                 await createAlert({
                    type: 'Urgent',
                    message: `${expenseUserName} submitted an expense report for ${formatCurrency(finalTotal)}.`,
                    priority: 'High',
                    action: `/management/expenses?highlight=${docRef.id}`,
                    creatorId: user.uid,
                    targetUserIds: managerIds,
                });
            }
        }
        
        if (onSuccess) {
            onSuccess();
        } else {
            reset({
                type: 'Reimbursement',
                date: format(new Date(), 'yyyy-MM-dd'),
                title: '',
                items: [{ description: '', category: 'Transport', amount: 0 }],
                totalAmount: 0,
                submittedFor: user.uid,
                otherUserName: '',
            });
        }

    } catch(e) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Submission Error',
            description: 'Could not save your expense report. Check permissions and try again.',
        });
    };
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
          
           {canSubmitForOthers && (
            <div className="space-y-2">
                <Label htmlFor="submittedFor">Submitted For</Label>
                 <Controller
                    name="submittedFor"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="submittedFor">
                            <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                             {users?.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                            <SelectItem value="Volunteer">Volunteer</SelectItem>
                            <SelectItem value="Intern">Intern</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                 {(submittedForSelection === 'Volunteer' || submittedForSelection === 'Intern') && (
                     <div className="mt-2 space-y-1 animate-in fade-in">
                        <Label htmlFor="otherUserName" className="text-xs">{submittedForSelection} Name</Label>
                        <Input id="otherUserName" {...register('otherUserName')} placeholder={`Enter ${submittedForSelection}'s name`} />
                        {errors.otherUserName && <p className="text-sm text-destructive">{`${errors.otherUserName.message}`}</p>}
                    </div>
                )}
            </div>
          )}

          <div className="space-y-2">
              <Label htmlFor="projectId">Link to Project (Optional)</Label>
               <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projects?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                        <div className="space-y-2 sm:col-span-2">
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
                                    {[
                                        "Transport", "Rent", "Office Dev't", "Projects", "Stationery",
                                        "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy",
                                        "Phone", "Food", "Mobile Money Charges", "IGA Expense",
                                        "Allowances and stipends", "Kibanja", "Professional Services",
                                        "community support", "miscellaneous", "Withdraw"
                                    ].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                        </div>
                         <div className="flex items-end gap-2">
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor={`items.${index}.amount`}>Amount</Label>
                                <Input id={`items.${index}.amount`} type="number" placeholder="10000" {...register(`items.${index}.amount`)} />
                                {errors.items?.[index]?.amount && <p className="text-sm text-destructive">{`${errors.items?.[index]?.amount?.message}`}</p>}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hidden sm:flex"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Item</span>
                            </Button>
                        </div>
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
                {isEditMode ? 'Save Changes' : 'Submit for Approval'}
            </Button>
        </div>
      </form>
  );
}
