
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, writeBatch, getDocs, doc, Timestamp, query, orderBy, where } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Loader2, Wand, FileSignature, CheckCircle, Goal, MessageSquare, Target, Sparkles, TrendingUp, Calendar, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { parseOperationalPlan } from '@/ai/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatDateSafe, formatDateForInput } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';
import { isPast, format, startOfWeek, isSameMonth, subMonths, addMonths } from 'date-fns';
import { CommentsSection } from '@/components/ui/comments';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton'; 
import { Input } from '@/components/ui/input';
interface ParsedKeyResult extends Omit<KeyResult, 'id' | 'deadline'> {
  deadline: string;
}

function KeyResultCard({ kr }: { kr: KeyResult }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [progressInput, setProgressInput] = useState(kr.currentProgress);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const progress = kr.target > 0 ? Math.min(100, Math.round((progressInput / kr.target) * 100)) : 0;
    const deadlineDate = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
    const deadlinePast = isPast(deadlineDate) && progress < 100;
    const formatTarget = (kr: KeyResult) => {
        if (kr.title?.includes('KR1') || kr.description?.toLowerCase().includes('ugx')) return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
        if (kr.target === 100) return `${kr.target}%`;
        return kr.target.toLocaleString();
    };

    const handleUpdate = async () => {
        if (!firestore) return;
        setIsUpdating(true);
        const krRef = doc(firestore, 'key-results', kr.id);
        try {
            await updateDocumentNonBlocking(krRef, { currentProgress: Number(progressInput) });
            toast({ title: 'Progress Updated', description: `Progress for "${kr.title}" has been saved.` });
        } catch (e) {
            console.error("Failed to update KR", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update progress.' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="h-20 w-20 text-omuto-navy/10" />
            </div>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                    <Badge className={`badge-omuto-outline ${kr.priority === 'High' ? 'border-omuto-red/30 text-omuto-red' : 'border-omuto-navy/20 text-omuto-navy/70'}`}>
                        {`${kr.priority} Priority`}
                    </Badge>
                    <ProgressRing progress={progress} size={48} strokeWidth={5} />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight leading-tight text-omuto-navy transition-colors">{kr.title}</CardTitle>
                <CardDescription className="font-bold line-clamp-2 mt-1 text-omuto-navy/70">{kr.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 border-md border-omuto-navy/10 rounded-xl">
                        <p className="text-[9px] font-black text-omuto-navy/50 uppercase tracking-widest mb-1">Target</p>
                        <p className="text-sm font-bold text-omuto-navy">{formatTarget(kr)}</p>
                    </div>
                    <div className="p-3 bg-muted/30 border-md border-omuto-navy/10 rounded-xl">
                        <p className="text-[9px] font-black text-omuto-navy/50 uppercase tracking-widest mb-1">Deadline</p>
                        <p className={`text-sm font-bold text-omuto-navy ${deadlinePast ? 'text-destructive' : ''}`}>{formatDateSafe(kr.deadline, 'dateOnly')}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0 pb-6 px-6">
                <div className="flex w-full gap-2 items-center">
                    <Input 
                        type="number" 
                        value={progressInput} 
                        onChange={(e) => setProgressInput(Number(e.target.value))} 
                        className="h-10 border-lg rounded-xl font-bold"
                    />
                    <Button onClick={handleUpdate} disabled={isUpdating} size="sm" className="h-10">
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}


function OperationalPlanViewer() {
    const firestore = useFirestore();
    const [currentDate, setCurrentDate] = useState(new Date());

    const keyResultsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(collection(db, 'key-results'), orderBy('priority'), orderBy('deadline'));
    }, [firestore]);

    const { data: allKeyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);

    const filteredKeyResults = useMemo(() => {
        if (!allKeyResults) return [];
        return allKeyResults.filter(kr => {
            const deadline = kr.deadline.toDate();
            return isSameMonth(deadline, currentDate);
        });
    }, [allKeyResults, currentDate]);
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4 mr-2"/> Prev Month</Button>
            <h2 className="font-bold text-lg w-48 text-center">{format(currentDate, 'MMMM yyyy')}</h2>
            <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>Next Month <ChevronRight className="h-4 w-4 ml-2"/></Button>
        </div>

        {filteredKeyResults.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKeyResults.map(kr => <KeyResultCard key={kr.id} kr={kr} />)}
            </div>
        ) : (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-white border-lg border-omuto-navy/20 rounded-2xl shadow-comic-sm mb-6"><Goal className="h-12 w-12 text-omuto-navy/30" /></div>
                    <h3 className="text-2xl font-bold tracking-tighter uppercase text-omuto-navy">No Plan For This Month</h3>
                    <p className="max-w-xs text-omuto-navy/60 font-bold mt-2 uppercase text-[10px] tracking-widest leading-relaxed">
                        There are no Key Results with deadlines in {format(currentDate, 'MMMM yyyy')}.
                    </p>
                </CardContent>
            </Card>
        )}
      </div>
    )
}

const krSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  description: z.string().min(5, 'Description is required.'),
  target: z.number().min(0),
  deadline: z.string().min(1, 'Deadline is required.'),
  priority: z.enum(['High', 'Medium', 'Low']),
});

function KeyResultFormItem({ 
    index, 
    register, 
    remove, 
    errors,
    control
}: { 
    index: number; 
    register: any; 
    remove: (index: number) => void; 
    errors: any;
    control: any;
}) {
    return (
        <div className="p-6 border-lg border-omuto-navy/10 rounded-2xl bg-white space-y-4 relative group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Key Result Title</Label>
                    <Input {...register(`keyResults.${index}.title`)} placeholder="e.g., KR1: Monthly Fundraising" />
                    {errors.keyResults?.[index]?.title && <p className="text-xs text-destructive font-bold">{errors.keyResults[index].title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Target Value (Number)</Label>
                    <Input type="number" {...register(`keyResults.${index}.target`, { valueAsNumber: true })} placeholder="e.g., 150000000" />
                    {errors.keyResults?.[index]?.target && <p className="text-xs text-destructive font-bold">{errors.keyResults[index].target.message}</p>}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...register(`keyResults.${index}.description`)} placeholder="Describe what success looks like..." />
                {errors.keyResults?.[index]?.description && <p className="text-xs text-destructive font-bold">{errors.keyResults[index].description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="date" {...register(`keyResults.${index}.deadline`)} />
                    {errors.keyResults?.[index]?.deadline && <p className="text-xs text-destructive font-bold">{errors.keyResults[index].deadline.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Priority</Label>
                    <Controller
                        control={control}
                        name={`keyResults.${index}.priority`}
                        render={({ field }: { field: any }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

function OperationalPlanUpdater() {
  const [isImporting, setIsImporting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const {
      register,
      control,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting }
  } = useForm({
      defaultValues: {
          keyResults: [{ title: '', description: '', target: 0, deadline: '', priority: 'Medium' }]
      }
  });

  const { fields, append, remove } = useFieldArray({
      control,
      name: "keyResults"
  });

  const handleParseWithAI = async () => {
    if (!pastedText.trim()) {
      toast({ variant: 'destructive', title: 'No Text', description: 'Paste plan text first.' });
      return;
    }
    setIsParsing(true);
    try {
      const result = await parseOperationalPlan({ planText: pastedText });
      const mappedResults = result.keyResults.map(kr => ({
          title: kr.title,
          description: kr.description,
          target: Number(kr.target) || 0,
          deadline: kr.deadline ? formatDateForInput(kr.deadline) : '',
          priority: (kr.priority as any) || 'Medium'
      }));
      reset({ keyResults: mappedResults });
      setIsImporting(false);
      toast({ title: 'Import Successful', description: `Loaded ${result.keyResults.length} Key Results.` });
    } catch (error) {
      console.error('Import error:', error);
      toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not structure the text.' });
    } finally {
      setIsParsing(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!firestore) return;
    const krCollection = collection(firestore, 'key-results');
    const batch = writeBatch(firestore);

    try {
      const existingDocsSnapshot = await getDocs(krCollection);
      existingDocsSnapshot.forEach(docSnapshot => batch.delete(docSnapshot.ref));

      data.keyResults.forEach((kr: any) => {
        const newDocRef = doc(krCollection);
        const deadlineDate = new Date(kr.deadline);
        batch.set(newDocRef, { 
            ...kr, 
            id: newDocRef.id,
            deadline: Timestamp.fromDate(isNaN(deadlineDate.getTime()) ? new Date() : deadlineDate),
            currentProgress: 0
        });
      });

      await batch.commit();
      toast({ title: 'Plan Activated', description: 'Organizational strategy has been updated.' });
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save strategy.' });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-omuto-navy">Structured Strategy Input</h2>
        <Button 
            variant="outline" 
            onClick={() => setIsImporting(!isImporting)}
            className="border-lg rounded-xl font-bold text-xs uppercase tracking-widest"
        >
            {isImporting ? <ChevronLeft className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4 text-omuto-yellow" />}
            {isImporting ? 'Back to Form' : 'Import from Text (AI)'}
        </Button>
      </div>

      {isImporting ? (
        <Card className="overflow-hidden bg-omuto-navy/5 border-dashed border-2 border-omuto-navy/20">
            <CardHeader>
                <CardTitle className="text-lg">Paste Raw Plan</CardTitle>
                <CardDescription>Paste your unstructured meeting notes or plan document here. We'll use AI to fill out the strategy form for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="E.g. KR1: Fundraising 150M by April. KR2: Support 2000 girls in RED Campaign..."
                    className="min-h-[200px] border-lg rounded-2xl p-6 bg-white"
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                />
                <Button onClick={handleParseWithAI} disabled={isParsing || !pastedText.trim()} className="w-full h-12">
                    {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                    Analyze & Fill Form
                </Button>
            </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <KeyResultFormItem 
                        key={field.id} 
                        index={index} 
                        register={register} 
                        remove={remove} 
                        errors={errors} 
                        control={control}
                    />
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-16 border-2 border-dashed border-omuto-navy/20 hover:border-omuto-navy/40 rounded-2xl"
                    onClick={() => append({ title: '', description: '', target: 0, deadline: '', priority: 'Medium' })}
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Manual Key Result
                </Button>
                
                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 h-16 btn-omuto shadow-comic-lg hover:shadow-comic-sm bg-primary text-white border-white"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                    Activate Strategy Framework
                </Button>
            </div>
            
            <Alert className="bg-omuto-yellow/10 border-omuto-yellow/30">
                <Target className="h-4 w-4 text-omuto-yellow" />
                <AlertTitle className="text-xs font-black uppercase tracking-widest">Caution: Overwrite Warning</AlertTitle>
                <AlertDescription className="text-xs font-bold text-omuto-navy/70">
                    Activating this strategy will replace all existing organizational Key Results. Ensure you have reviewed all items before proceeding.
                </AlertDescription>
            </Alert>
        </form>
      )}
    </div>
  );
}

export default function OperationalPlanPage() {
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    
    const canEdit = profile && ['Administrator', 'Executive Director'].includes(profile.role);

    return (
        <div className="space-y-10 pb-10">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-omuto-navy">
                    <div className="p-3 bg-omuto-navy/10 rounded-2xl">
                        <Goal className="h-8 w-8 text-omuto-red" />
                    </div>
                    <div>
                        <h1 className="font-heading text-4xl font-bold tracking-tight">Impact <span className="text-omuto-red">Strategy</span></h1>
                        <p className="text-omuto-navy/60 font-bold uppercase text-[10px] tracking-widest mt-1">Operational Objectives & Key Result Framework</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="view" className="w-full">
                <TabsList className="bg-omuto-navy/10 p-1 rounded-xl mb-8 border-lg border-omuto-navy/10">
                    <TabsTrigger value="view" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-omuto-navy data-[state=active]:text-white data-[state=active]:shadow-comic-sm data-[state=active]:border-omuto-navy">
                        View Plan
                    </TabsTrigger>
                    {canEdit && <TabsTrigger value="edit" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-omuto-navy data-[state=active]:text-white data-[state=active]:shadow-comic-sm data-[state=active]:border-omuto-navy">
                        Update Plan
                    </TabsTrigger>}
                </TabsList>
                <TabsContent value="view" className="mt-0">
                    <OperationalPlanViewer />
                </TabsContent>
                {canEdit && (
                    <TabsContent value="edit" className="mt-0">
                        <OperationalPlanUpdater />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
