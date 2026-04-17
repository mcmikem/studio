
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
import { uploadFile, uploadFileWithFallback } from '@/firebase/storage';
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
import { callAIOfflineFirst, offlineProcessReceipt } from '@/lib/offline-ai';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import type { Expense, User, Project, ExpenseItem } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormProgress } from '@/components/ui/form-progress';
import { triggerWebhook, sendEmailNotification, notifyNewExpense } from '@/lib/integration-utils';

const expenseItemSchema = z.object({
  description: z.string(),
  category: z.enum(expenseItemCategories),
  amount: z.coerce.number().default(0),
});

const expenseSchema = z.object({
  title: z.string().min(3, 'Please provide a title for the report.'),
  type: z.enum(["Requisition", "Reimbursement", "Accountability"]),
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

        const ocrInput = { imageBase64: base64 };
        const result = await callAIOfflineFirst(
            () => processReceiptAction(ocrInput),
            () => offlineProcessReceipt(ocrInput)
        );
        
        if (result.title === 'Extraction Failed' || result.title.includes('Offline') || result.items.length === 0) {
            toast({ variant: 'destructive', title: navigator.onLine ? 'Scan Failed' : 'Offline', description: navigator.onLine ? 'We couldn\'t read the receipt. Please try a clearer photo.' : 'Receipt scanning requires an internet connection. Please enter items manually.' });
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
            const uploadResult = await uploadFileWithFallback(firebaseApp, receiptFile, buildUploadPath.expenseReceipt(user.uid, `${safeName}.${ext}`), user.uid);
            finalReceiptUrl = uploadResult?.url || '';
            if (!uploadResult?.success && uploadResult?.error) {
                toast({ variant: 'destructive', title: 'Upload Warning', description: `Receipt may not have saved. ${uploadResult.error}` });
            }
            setIsUploading(false);
        }

        if (isEditMode && effectiveExpense) {
            const docRef = doc(firestore, 'expenses', effectiveExpense.id);
            await updateDocumentNonBlocking(docRef, { ...expenseData, receiptUrl: finalReceiptUrl });
            toast({ title: 'Report Updated!' });
        } else {
            // Accountability type is auto-acknowledged since funds already accounted for
            const isAccountability = data.type === 'Accountability';
            const newExpenseData = { 
              ...expenseData, 
              receiptUrl: finalReceiptUrl, 
              status: isAccountability ? 'Acknowledged' as const : 'Pending' as const, 
              createdAt: serverTimestamp() 
            };
            const expensesCollection = collection(firestore, 'expenses');
            const docRef = await addDocumentNonBlocking(expensesCollection, newExpenseData);
            toast({ title: 'Report Submitted!' });

            const managementUsersQuery = query(collection(firestore, 'users'), where('role', 'in', ['Administrator', 'Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager', 'Media & Finance Lead']));
            const managementSnapshot = await getDocs(managementUsersQuery);
            const managerIds = managementSnapshot.docs.map(d => d.id).filter(id => id !== user.uid);
            const managerEmails = managementSnapshot.docs.map(d => d.data()?.email).filter(Boolean);

            if (managerIds.length > 0) {
                 await createAlert({
                    type: 'Urgent',
                    message: `${expenseUserName} submitted a request for ${formatCurrency(finalTotal)}.`,
                    priority: 'High',
                    action: `/finance/requisitions?highlight=${docRef.id}`,
                    creatorId: user.uid,
                    targetUserIds: managerIds,
                });
                
                // Trigger integrations
                notifyNewExpense(managerEmails, expenseUserName, data.title, formatCurrency(finalTotal), `/finance/requisitions?highlight=${docRef.id}`).catch(console.error);
            }
        }
        if (onSuccess) onSuccess();
        clearDraft();
        
        if (!isEditMode) {
            reset();
            setReceiptFile(null);
        } else if (!expense) {
            // If we're on a dedicated edit page, maybe redirect back
            router.push('/finance/requisitions');
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
    <Card className="border shadow-comic-sm w-full overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-3">
                <div className="p-2 sm:p-3 bg-card border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
                    <Receipt className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                        Expense <span className="text-omuto-red">Report</span>
                    </CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                        {isEditMode ? 'Modification Authorized' : 'Financial Accountability Terminal'}
                    </CardDescription>
                </div>
            </div>
      </CardHeader>
      <div className="bg-muted/20 px-4 sm:px-6 pt-4">
        <FormProgress steps={['Type & Date', 'Details', 'Receipt', 'Review']} currentStep={0} />
      </div>
      {isExpenseLoading ? (
          <CardContent className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-12 w-full" /><Skeleton className="h-16 w-3/4" /><Skeleton className="h-32 w-full" />
          </CardContent>
      ) : (
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            
            {/* 1. Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="space-y-3 sm:space-y-4">
                    <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Action Type</Label>
                    <Controller name="type" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <div className="flex items-center space-x-2 sm:space-x-3 bg-muted/30 dark:bg-white/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white dark:has-[:checked]:bg-omuto-navy has-[:checked]:text-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Requisition" id="req" className="border-2" />
                                <Label htmlFor="req" className="font-bold uppercase text-[10px] sm:text-xs cursor-pointer text-omuto-navy dark:text-white">Requisition</Label>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3 bg-muted/30 dark:bg-white/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white dark:has-[:checked]:bg-omuto-navy has-[:checked]:text-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Reimbursement" id="reim" className="border-2" />
                                <Label htmlFor="reim" className="font-bold uppercase text-[10px] sm:text-xs cursor-pointer text-omuto-navy dark:text-white">Reimbursement</Label>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3 bg-muted/30 dark:bg-white/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white dark:has-[:checked]:bg-omuto-navy has-[:checked]:text-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Accountability" id="acc" className="border-2" />
                                <Label htmlFor="acc" className="font-bold uppercase text-[10px] sm:text-xs cursor-pointer text-omuto-navy dark:text-white">Accountability</Label>
                            </div>
                        </RadioGroup>
                    )} />
                </div>
                <div className="space-y-3 sm:space-y-4 text-left sm:text-right">
                    <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pr-1">Reporting Date</Label>
                    <Input type="date" {...register('date')} className="h-12 sm:h-14 border rounded-xl sm:rounded-2xl text-left sm:text-right font-bold text-omuto-navy" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Mission / Title</Label>
                <Input id="title" placeholder="e.g., Mpigi Field Distribution" {...register('title')} className="h-12 sm:h-14 border rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold tracking-tight text-omuto-navy" />
                {errors.title && <p className="text-omuto-red text-xs font-bold pt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-3 sm:space-y-4">
                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Attach Receipt</Label>
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <Input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                    toast({ variant: 'destructive', title: 'Receipt too large', description: `${(file.size / 1024 / 1024).toFixed(1)}MB — please use under 5MB.` });
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
                        className="h-12 sm:h-14 flex items-center justify-center gap-2 border border-omuto-navy border-dashed rounded-xl sm:rounded-2xl bg-muted/20 px-4 cursor-pointer hover:bg-muted/40 transition-colors w-full font-bold text-omuto-navy text-sm"
                    >
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                        {receiptFile ? receiptFile.name : 'Upload Receipt'}
                    </Label>
                    {receiptFile && (
                        <Button 
                            type="button" 
                            onClick={handleMagicScan} 
                            disabled={isScanning}
                            className="h-12 sm:h-14 px-4 sm:px-6 bg-omuto-yellow text-omuto-navy border border-omuto-navy shadow-comic-sm text-sm"
                        >
                            {isScanning ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                            <span className="hidden sm:inline ml-2">{isScanning ? 'SCANNING...' : 'SCAN'}</span>
                        </Button>
                    )}
                </div>
                {receiptPreview && (
                    <div className="mt-2 p-2 border rounded-lg sm:rounded-xl bg-muted/20 inline-block">
                        <img src={receiptPreview} alt="Receipt preview" className="max-h-24 sm:max-h-32 rounded-lg object-contain" />
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 text-center">Preview</p>
                    </div>
                )}
                {expense?.receiptUrl && !receiptPreview && (
                    <p className="text-xs text-muted-foreground">Current receipt attached.</p>
                )}
            </div>

            <Separator className="bg-omuto-navy/5" />

            {/* 2. Line Items */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="font-heading font-bold uppercase tracking-tight text-base sm:text-lg text-omuto-navy dark:text-white">Log Entries</h3>
                    <Button type="button" onClick={() => append({ description: '', category: 'Transport', amount: 0 })} className="btn-omuto bg-omuto-navy dark:bg-white dark:text-omuto-navy text-white h-10 w-full sm:w-auto px-4 text-sm">
                        <PlusCircle className="h-4 w-4 mr-2" /> Add
                    </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative p-4 sm:p-6 bg-muted/20 dark:bg-white/5 border border-omuto-navy/20 dark:border-white/10 rounded-xl sm:rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                             <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                                <div className="sm:col-span-5 space-y-2">
                                    <Label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                                    <Input {...register(`items.${index}.description`)} className="h-11 sm:h-12 border rounded-lg sm:rounded-xl font-bold bg-white dark:bg-omuto-navy text-omuto-navy dark:text-white text-sm" placeholder="What was this for?" />
                                </div>
                                <div className="sm:col-span-3 space-y-2">
                                    <Label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                    <Controller
                                        name={`items.${index}.category`}
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="h-11 sm:h-12 border rounded-lg sm:rounded-xl font-bold bg-white dark:bg-omuto-navy text-omuto-navy dark:text-white text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {expenseItemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="sm:col-span-3 space-y-2">
                                    <Label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (UGX)</Label>
                                    <Input type="number" {...register(`items.${index}.amount`)} className="h-11 sm:h-12 border rounded-lg sm:rounded-xl font-bold bg-white dark:bg-omuto-navy text-omuto-navy dark:text-white text-sm" />
                                </div>
                                <div className="sm:col-span-1 flex justify-center pb-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 rounded-xl hover:bg-omuto-red hover:text-white transition-all text-omuto-navy/60 dark:text-white/60">
                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Footer Summary */}
            <div className="p-4 sm:p-6 lg:p-8 bg-omuto-navy rounded-xl sm:rounded-2xl shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl"><Wallet className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-omuto-yellow" /></div>
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">Total</p>
                        <p className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                 <Button type="submit" disabled={isSubmitting || isUploading} className="btn-omuto w-full sm:w-auto h-12 sm:h-14 text-sm bg-omuto-red border border-white shadow-comic-sm">
                    {(isSubmitting || isUploading) ? <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                    {isUploading ? 'UPLOADING' : 'SUBMIT'}
                </Button>
            </div>

        </CardContent>
      </form>
      )}
    </Card>
  );
}
