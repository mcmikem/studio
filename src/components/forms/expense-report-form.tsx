
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
  useFirebaseApp,
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  useDoc
} from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { collection, serverTimestamp, doc, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Loader2, FilePlus2, PlusCircle, Trash2, Receipt, Wallet, Sparkles, ArrowRight, Upload, Wand2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { createAlertAction as createAlert } from '@/actions/mutations';
import { processReceiptAction } from '@/ai/actions';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import type { Expense, User, Project, ExpenseItem } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const expenseItemSchema = z.object({
  description: z.string(),
  category: z.enum(expenseItemCategories),
  amount: z.coerce.number().default(0),
});

const expenseSchema = z.object({
  title: z.string().min(3, 'Please provide a title for the report.'),
  type: z.enum(["Requisition", "Reimbursement"]),
  date: z.string().min(1, 'Date is required.'),
  projectId: z.string().optional(),
  items: z.array(expenseItemSchema),
  totalAmount: z.coerce.number().default(0),
  submittedFor: z.string().optional(),
  otherUserName: z.string().optional(),
  receiptUrl: z.string().optional(),
}).transform((data) => ({
    ...data,
    items: (data.items || []).filter(item => item.description && item.amount > 0),
})).refine(data => {
    if ((data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') && !data.otherUserName) {
        return false;
    }
    return true;
}, {
    message: "Please specify the name for the selected role.",
    path: ["otherUserName"],
}).refine(data => {
    return data.items.length > 0;
}, {
    message: 'Please add at least one expense item.',
    path: ['items'],
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenseIdFromUrl = searchParams.get('id');

  const expenseDocRef = useMemoFirebase(() => {
    if (!firestore || !expenseIdFromUrl || expense) return null;
    return doc(firestore, 'expenses', expenseIdFromUrl);
  }, [firestore, expenseIdFromUrl, expense]);
  
  const { data: expenseFromUrl, isLoading: isExpenseLoading } = useDoc<Expense>(expenseDocRef);

  const effectiveExpense = expense || expenseFromUrl;
  const isEditMode = !!effectiveExpense;

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users } = useCollection<User>(usersQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'projects'), orderBy('name')) : null, [firestore]);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const firebaseApp = useFirebaseApp();
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

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
    defaultValues: {
      type: 'Reimbursement',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      items: [{ description: '', category: 'Transport', amount: 0 }],
      totalAmount: 0,
      submittedFor: user?.uid,
      otherUserName: '',
    },
  });

  React.useEffect(() => {
    if (!effectiveExpense) return;
    reset({
        ...effectiveExpense,
        date: formatDateSafe(effectiveExpense.date, 'iso'),
        items: effectiveExpense.items.map(item => ({...item})),
        submittedFor: effectiveExpense.userId
    });
  }, [effectiveExpense, reset]);

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

  // --- AUTO SAVE DRAFT LOGIC ---
  const draftKey = React.useMemo(() => `omuto_draft_expense_${isEditMode ? effectiveExpense?.id : 'new'}`, [isEditMode, effectiveExpense]);
  const allFormValues = useWatch({ control });

  // Load draft on mount (only if NOT in edit mode, to avoid overwriting real data with old drafts)
  React.useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if there's actual typed content (title or items with description)
        const hasContent = parsed.title || (parsed.items && parsed.items.some((i: any) => i.description));
        if (hasContent) {
           reset({ ...parsed, date: parsed.date || format(new Date(), 'yyyy-MM-dd') });
           toast({
             title: "Draft Restored",
             description: "We restored your unsaved expense report.",
           });
        }
      }
    } catch (e) {
      console.error("Failed to load expense draft", e);
    }
  }, [draftKey, isEditMode, reset, toast]);

  // Save draft on every change
  React.useEffect(() => {
    if (isEditMode) return; // Don't auto-save drafts over existing published records
    
    // Check if form is essentially empty
    const isEmpty = !allFormValues.title && 
                   (!allFormValues.items || allFormValues.items.every(i => !i?.description && !i?.amount));
                   
    if (isEmpty) return;
    
    localStorage.setItem(draftKey, JSON.stringify(allFormValues));
  }, [allFormValues, draftKey, isEditMode]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
  };

  const handleMagicScan = async () => {
    if (!receiptFile) {
        toast({ title: 'No receipt found', description: 'Please upload a receipt image first.' });
        return;
    }

    try {
        setIsScanning(true);
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
        });
        reader.readAsDataURL(receiptFile);
        const base64 = await base64Promise;

        const result = await processReceiptAction({ imageBase64: base64 });
        
        if (result.title === 'Extraction Failed' || result.items.length === 0) {
            toast({ variant: 'destructive', title: 'Scan Failed', description: 'We couldn\'t read the receipt. Please try a clearer photo.' });
        } else {
            // Apply results to form
            setValue('title', result.title);
            setValue('items', result.items);
            setValue('totalAmount', result.totalAmount);
            
            toast({
                title: 'Magic Scan Complete!',
                description: `Extracted ${result.items.length} items totaling ${formatCurrency(result.totalAmount)}.`,
            });
        }
    } catch (error) {
        console.error('Magic scan failed:', error);
        toast({ variant: 'destructive', title: 'Scan Error', description: 'An unexpected error occurred during receipt analysis.' });
    } finally {
        setIsScanning(false);
    }
  };
  // -----------------------------

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
        let finalReceiptUrl = data.receiptUrl || '';

        if (receiptFile && firebaseApp) {
            setIsUploading(true);
            const ext = receiptFile.name.split('.').pop() || 'jpg';
            const safeName = `receipt_${Date.now()}`;
            finalReceiptUrl = await uploadFile(firebaseApp, receiptFile, buildUploadPath.expenseReceipt(user.uid, `${safeName}.${ext}`));
            setIsUploading(false);
        }

        if (isEditMode && effectiveExpense) {
            const docRef = doc(firestore, 'expenses', effectiveExpense.id);
            await updateDocumentNonBlocking(docRef, { ...expenseData, receiptUrl: finalReceiptUrl });
            toast({ title: 'Report Updated!' });
        } else {
            const newExpenseData = { ...expenseData, receiptUrl: finalReceiptUrl, status: 'Pending' as const, createdAt: serverTimestamp() };
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
        clearDraft();
        
        if (!isEditMode) {
            reset();
            setReceiptFile(null);
        } else if (!expense) {
            // If we're on a dedicated edit page, maybe redirect back
            router.push('/management/expenses');
        }
    } catch(e) {
        console.error(e);
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Submission Error', description: 'Failed to submit the report or upload the receipt.' });
    };
  };

  const onInvalid = (errors: any) => {
    toast({
        variant: 'destructive',
        title: 'Form Validation Failed',
        description: 'Please check all required fields and try again.'
    });
  };


  return (
    <Card className="border-lg shadow-comic-sm">
      <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 p-5 sm:p-8">
            <div className="p-3 bg-white border-lg border-omuto-navy/20 shadow-comic-sm rounded-2xl w-fit mb-6 rotate-[-2deg]">
                <Receipt className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-none text-omuto-navy">
                Expense <span className="text-omuto-red underline decoration-4 underline-offset-4">Report</span>
            </CardTitle>
            <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-[0.2em] mt-2">
                {isEditMode ? 'Modification Authorized' : 'Financial Accountability Terminal'}
            </CardDescription>
      </CardHeader>
      {isExpenseLoading ? (
          <CardContent className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" /><Skeleton className="h-16 w-3/4" /><Skeleton className="h-32 w-full" />
          </CardContent>
      ) : (
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <CardContent className="p-5 sm:p-8 space-y-8 sm:space-y-12">
            
            {/* 1. Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-4">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pl-1">Action Type</Label>
                    <Controller name="type" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="flex items-center space-x-3 bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Requisition" id="req" className="border-2" />
                                <Label htmlFor="req" className="font-bold uppercase text-xs cursor-pointer text-omuto-navy">Requisition</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Reimbursement" id="reim" className="border-2" />
                                <Label htmlFor="reim" className="font-bold uppercase text-xs cursor-pointer text-omuto-navy">Reimbursement</Label>
                            </div>
                        </RadioGroup>
                    )} />
                </div>
                <div className="space-y-4 text-left sm:text-right">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pr-1">Reporting Date</Label>
                    <Input type="date" {...register('date')} className="h-12 sm:h-14 border-lg rounded-2xl text-left sm:text-right font-bold text-omuto-navy" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-[10px] uppercase tracking-widest pl-1">Mission / Title</Label>
                <Input id="title" placeholder="e.g., Mpigi Field Distribution" {...register('title')} className="h-16 border-lg rounded-2xl text-xl font-bold tracking-tight text-omuto-navy" />
                {errors.title && <p className="text-omuto-red text-xs font-bold pt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pl-1">Attach Receipt</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast({ variant: 'destructive', title: 'Receipt too large', description: `${(file.size / 1024 / 1024).toFixed(1)}MB — please use an image under 5MB.` });
                                        return;
                                    }
                                    setReceiptFile(file);
                                    setReceiptPreview(URL.createObjectURL(file));
                                }
                            }}
                            className="hidden" 
                            id="receipt-upload" 
                        />
                        <Label 
                            htmlFor="receipt-upload" 
                            className="h-14 flex items-center justify-center gap-2 border-lg border-omuto-navy border-dashed rounded-2xl bg-muted/20 px-6 cursor-pointer hover:bg-muted/40 transition-colors w-full font-bold text-omuto-navy"
                        >
                            <Upload className="h-5 w-5" />
                            {receiptFile ? receiptFile.name : 'Upload Receipt Image'}
                        </Label>
                        {receiptFile && (
                            <Button 
                                type="button" 
                                onClick={handleMagicScan} 
                                disabled={isScanning}
                                className="h-14 px-6 bg-omuto-yellow text-omuto-navy border-lg border-omuto-navy shadow-comic-sm hover:bg-omuto-yellow/90 hover:-translate-y-0.5"
                            >
                                {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5 mr-2" />}
                                {isScanning ? 'SCANNING...' : 'MAGIC SCAN'}
                            </Button>
                        )}
                    </div>
                    {receiptPreview && (
                        <div className="mt-3 p-2 border rounded-xl bg-muted/20 inline-block">
                            <img src={receiptPreview} alt="Receipt preview" className="max-h-32 rounded-lg object-contain" />
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 text-center">Preview</p>
                        </div>
                    )}
                    {expense?.receiptUrl && !receiptPreview && (
                        <p className="text-xs text-muted-foreground">Current receipt attached. Upload new to replace.</p>
                    )}
                </div>
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
                        <div key={field.id} className="relative p-4 sm:p-6 bg-muted/20 border-lg border-omuto-navy/20 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
                             <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-end">
                                <div className="sm:col-span-5 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Input {...register(`items.${index}.description`)} className="h-12 border-md rounded-xl font-bold bg-white text-omuto-navy" placeholder="What was this for?" />
                                </div>
                                <div className="sm:col-span-3 space-y-2">
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
                                <div className="sm:col-span-3 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Amount (UGX)</Label>
                                    <Input type="number" {...register(`items.${index}.amount`)} className="h-12 border-md rounded-xl font-bold bg-white text-omuto-navy" />
                                </div>
                                <div className="sm:col-span-1 flex justify-center pb-1">
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
            <div className="p-4 sm:p-8 bg-omuto-navy rounded-3xl shadow-comic flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/10 rounded-2xl"><Wallet className="h-6 sm:h-8 w-6 sm:w-8 text-omuto-yellow" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Validated Total</p>
                        <p className="font-heading text-2xl sm:text-4xl font-bold text-white tracking-tighter">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                 <Button type="submit" disabled={isSubmitting || isUploading} className="btn-omuto w-full h-12 sm:h-16 text-sm bg-omuto-red border-lg border-white text-white shadow-comic-sm hover:shadow-comic-sm">
                    {(isSubmitting || isUploading) ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5 fill-white" />}
                    {isUploading ? 'UPLOADING...' : 'DEPLOY REPORT'}
                </Button>
            </div>

        </CardContent>
      </form>
      )}
    </Card>
  );
}
