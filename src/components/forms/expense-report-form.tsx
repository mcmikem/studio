
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
import { Loader2, FilePlus2, PlusCircle, Trash2, Receipt, Wallet, Sparkles, ArrowRight } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { createAlert } from '@/ai/actions';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import type { Expense, User, Project, ExpenseItem } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const expenseItemSchema = z.object({
  description: z.string().min(1, 'Item description is required.'),
  category: z.enum(expenseItemCategories),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
});

const expenseSchema = z.object({
  title: z.string().min(3, 'Please provide a title for the report.'),
  type: z.enum(["Requisition", "Reimbursement"]),
  date: z.string().min(1, 'Date is required.'),
  projectId: z.string().optional(),
  items: z.array(expenseItemSchema).min(1, 'Please add at least one expense item.'),
  totalAmount: z.number().min(1, 'Total amount must be greater than zero.'),
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
  const { data: users } = useCollection<User>(usersQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'projects'), orderBy('name')) : null, [firestore]);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const isEditMode = !!expense;
  const financeRoles = ['Administrator', 'Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Programs & Partnerships Manager'];
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
        items: expense.items.map(item => ({...item})),
        submittedFor: expense.userId
    } : {
      type: 'Reimbursement',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      items: [{ description: '', category: 'Transport', amount: 0 }],
      totalAmount: 0,
      submittedFor: user?.uid,
      otherUserName: '',
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
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    
    const finalItems = data.items.filter(item => item.description.trim() !== '' && item.amount > 0) as ExpenseItem[];
    if (finalItems.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Report', description: 'Please add at least one valid expense item.' });
      return;
    }

    const finalTotal = finalItems.reduce((sum, item) => sum + item.amount, 0);

    let expenseUserId = user.uid;
    let expenseUserName = profile.name;

    if (canSubmitForOthers && data.submittedFor) {
        if (data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') {
            expenseUserId = data.submittedFor.toLowerCase();
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
            toast({ title: 'Report Updated!' });
        } else {
            const newExpenseData = { ...expenseData, status: 'Pending' as const, createdAt: serverTimestamp() };
            const expensesCollection = collection(firestore, 'expenses');
            const docRef = await addDocumentNonBlocking(expensesCollection, newExpenseData);
            toast({ title: 'Report Submitted!' });

            const managementUsersQuery = query(collection(firestore, 'users'), where('role', 'in', ['Administrator', 'Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager', 'Media & Finance Lead']));
            const managementSnapshot = await getDocs(managementUsersQuery);
            const managerIds = managementSnapshot.docs.map(d => d.id).filter(id => id !== user.uid);

            if (managerIds.length > 0) {
                 await createAlert({
                    type: 'Urgent',
                    message: `${expenseUserName} submitted a request for ${formatCurrency(finalTotal)}.`,
                    priority: 'High',
                    action: `/management/expenses?highlight=${docRef.id}`,
                    creatorId: user.uid,
                    targetUserIds: managerIds,
                });
            }
        }
        if (onSuccess) onSuccess();
        else reset();
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Submission Error' });
    };
  };


  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 p-8 md:p-12">
            <div className="p-3 bg-white border-lg border-omuto-navy/20 shadow-comic-sm rounded-2xl w-fit mb-6 rotate-[-2deg]">
                <Receipt className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-4xl font-bold tracking-tight uppercase leading-none text-omuto-navy">
                Expense <span className="text-omuto-red underline decoration-4 underline-offset-4">Report</span>
            </CardTitle>
            <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-[0.2em] mt-2">Financial Accountability Terminal</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-8 md:p-12 space-y-12">
            
            {/* 1. Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pl-1">Action Type</Label>
                    <Controller name="type" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-3 bg-muted/30 px-6 py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Requisition" id="req" className="border-2" />
                                <Label htmlFor="req" className="font-bold uppercase text-xs cursor-pointer text-omuto-navy">Requisition</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-muted/30 px-6 py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Reimbursement" id="reim" className="border-2" />
                                <Label htmlFor="reim" className="font-bold uppercase text-xs cursor-pointer text-omuto-navy">Reimbursement</Label>
                            </div>
                        </RadioGroup>
                    )} />
                </div>
                <div className="space-y-4 text-right">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pr-1">Reporting Date</Label>
                    <Input type="date" {...register('date')} className="h-14 border-lg rounded-2xl text-right font-bold text-omuto-navy" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-[10px] uppercase tracking-widest pl-1">Mission / Title</Label>
                <Input id="title" placeholder="e.g., Mpigi Field Distribution" {...register('title')} className="h-16 border-lg rounded-2xl text-xl font-bold tracking-tight text-omuto-navy" />
            </div>

            <Separator className="bg-omuto-navy/5" />

            {/* 2. Line Items */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold uppercase tracking-tighter text-xl text-omuto-navy">Log Entries</h3>
                    <Button type="button" onClick={() => append({ description: '', category: 'Transport', amount: 0 })} className="btn-omuto bg-omuto-navy text-white h-10 px-4">
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative p-6 bg-muted/20 border-lg border-omuto-navy/20 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                <div className="md:col-span-5 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Input {...register(`items.${index}.description`)} className="h-12 border-md rounded-xl font-bold bg-white text-omuto-navy" placeholder="What was this for?" />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                                    <Controller
                                        name={`items.${index}.category`}
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="h-12 border-md rounded-xl font-bold bg-white text-omuto-navy"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {expenseItemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Amount (UGX)</Label>
                                    <Input type="number" {...register(`items.${index}.amount`)} className="h-12 border-md rounded-xl font-bold bg-white text-omuto-navy" />
                                </div>
                                <div className="md:col-span-1 flex justify-center pb-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 rounded-xl hover:bg-omuto-red hover:text-white transition-all text-omuto-navy/60">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Footer Summary */}
            <div className="p-8 bg-omuto-navy rounded-3xl shadow-comic flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl"><Wallet className="h-8 w-8 text-omuto-yellow" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Validated Total</p>
                        <p className="font-heading text-4xl font-bold text-white tracking-tighter">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                 <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-16 text-sm bg-omuto-red border-lg border-white text-white shadow-comic-sm hover:shadow-comic-sm">
                    {isSubmitting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5 fill-white" />}
                    DEPLOY REPORT
                </Button>
            </div>

        </CardContent>
      </form>
    </Card>
  );
}
