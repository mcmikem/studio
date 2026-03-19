
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { collection, writeBatch, getDocs, doc, Timestamp, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
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
import { isPast, format, startOfWeek, isSameMonth, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
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
        const unit = (kr as any).unit || '';
        if (kr.description?.toLowerCase().includes('ugx') || kr.description?.toLowerCase().includes('shilling')) {
            return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
        }
        if (kr.target === 100) return `${kr.target}%`;
        const num = kr.target.toLocaleString();
        return unit ? `${num} ${unit}` : num;
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
            <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="h-12 w-12 sm:h-16 sm:w-16 text-omuto-navy/10" />
            </div>
            <CardHeader className="pb-3 sm:pb-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                    <Badge className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${kr.priority === 'High' ? 'border-omuto-red/30 bg-omuto-red/10 text-omuto-red' : kr.priority === 'Medium' ? 'border-omuto-yellow/30 bg-omuto-yellow/10 text-omuto-yellow' : 'border-green-500/30 bg-green-500/10 text-green-600'}`}>
                        {kr.priority}
                    </Badge>
                    <ProgressRing progress={progress} size={40} strokeWidth={4} />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight leading-tight text-omuto-navy transition-colors line-clamp-2">{kr.title}</CardTitle>
                <CardDescription className="font-bold line-clamp-2 mt-1 text-omuto-navy/70 text-xs sm:text-sm">{kr.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-muted/30 border border-omuto-navy/10 rounded-lg sm:rounded-xl">
                        <p className="text-[9px] sm:text-[10px] font-black text-omuto-navy/50 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Target</p>
                        <p className="text-xs sm:text-sm font-bold text-omuto-navy truncate">{formatTarget(kr)}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-muted/30 border border-omuto-navy/10 rounded-lg sm:rounded-xl">
                        <p className="text-[9px] sm:text-[10px] font-black text-omuto-navy/50 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Deadline</p>
                        <p className={`text-xs sm:text-sm font-bold text-omuto-navy truncate ${deadlinePast ? 'text-destructive' : ''}`}>{formatDateSafe(kr.deadline, 'dateOnly')}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0 pb-3 sm:pb-4 px-3 sm:px-4">
                <div className="flex w-full gap-2 items-center">
                    <Input 
                        type="number" 
                        value={progressInput} 
                        onChange={(e) => setProgressInput(Number(e.target.value))} 
                        className="h-9 sm:h-10 border rounded-lg font-bold text-sm"
                    />
                    <Button onClick={handleUpdate} disabled={isUpdating} size="sm" className="h-9 sm:h-10 px-3">
                        {isUpdating ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <span className="text-xs sm:text-sm">Update</span>}
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

    useEffect(() => {
        if (allKeyResults && allKeyResults.length > 0) {
            const mostRecent = allKeyResults.reduce((latest, kr) => {
                const deadline = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
                if (!latest || deadline > latest) return deadline;
                return latest;
            }, null as Date | null);
            if (mostRecent) {
                setCurrentDate(mostRecent);
            }
        }
    }, [allKeyResults]);

    const filteredKeyResults = useMemo(() => {
        if (!allKeyResults) return [];
        return allKeyResults.filter(kr => {
            const deadline = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1"/> <span className="hidden sm:inline">Prev</span></Button>
            <h2 className="font-bold text-sm sm:text-base w-28 sm:w-40 text-center truncate">{format(currentDate, 'MMMM yyyy')}</h2>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><span className="hidden sm:inline">Next</span> <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1"/></Button>
        </div>

        {filteredKeyResults.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
  target: z.coerce.number().min(0),
  unit: z.string().optional(),
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
        <div className="p-4 sm:p-6 border border-omuto-navy/10 rounded-xl sm:rounded-2xl bg-white space-y-4 relative group">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Key Result</Label>
                    <Input {...register(`keyResults.${index}.title`)} placeholder="e.g., Train 50 youth" className="h-10 sm:h-11" />
                    {errors.keyResults?.[index]?.title && <p className="text-xs text-destructive">{errors.keyResults[index].title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Metric Value</Label>
                    <div className="flex gap-2">
                        <Input type="number" {...register(`keyResults.${index}.target`, { valueAsNumber: true })} placeholder="e.g., 50" className="h-10 sm:h-11 w-24 sm:w-32" />
                        <Input {...register(`keyResults.${index}.unit`)} placeholder="e.g., youth" className="h-10 sm:h-11 flex-1" />
                    </div>
                    {errors.keyResults?.[index]?.target && <p className="text-xs text-destructive">{errors.keyResults[index].target.message}</p>}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Description</Label>
                <Textarea {...register(`keyResults.${index}.description`)} placeholder="Describe what success looks like..." className="min-h-[60px] sm:min-h-[80px] text-sm" />
                {errors.keyResults?.[index]?.description && <p className="text-xs text-destructive">{errors.keyResults[index].description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Deadline</Label>
                    <Input type="date" {...register(`keyResults.${index}.deadline`)} className="h-10 sm:h-11" />
                    {errors.keyResults?.[index]?.deadline && <p className="text-xs text-destructive">{errors.keyResults[index].deadline.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Priority</Label>
                    <Controller
                        control={control}
                        name={`keyResults.${index}.priority`}
                        render={({ field }: { field: any }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-10 sm:h-11">
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

            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => remove(index)}>
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
          keyResults: [{ title: '', description: '', target: 0, unit: '', deadline: '', priority: 'Medium' }]
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
      if (!result.keyResults || result.keyResults.length === 0) {
        throw new Error('AI returned no results. Try reformatting your plan text.');
      }
      const mappedResults = result.keyResults.map(kr => ({
          title: kr.title,
          description: kr.description,
          target: Number(kr.target) || 0,
          unit: kr.unit || '',
          deadline: kr.deadline ? formatDateForInput(kr.deadline) : '',
          priority: (kr.priority as any) || 'Medium'
      }));
      reset({ keyResults: mappedResults });
      setIsImporting(false);
      toast({ title: 'Import Successful', description: `Loaded ${result.keyResults.length} Key Results with metrics.` });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Import Failed', 
        description: error?.message || 'Could not structure the text. Try simplifying your plan format.' 
      });
    } finally {
      setIsParsing(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!firestore) return;
    const krCollection = collection(firestore, 'key-results');
    const metricsCollection = collection(firestore, 'impact-metrics');
    const batch = writeBatch(firestore);

    try {
      const targetMonthStart = data.keyResults.reduce((earliest: Date, kr: any) => {
        const d = new Date(kr.deadline);
        if (!earliest || d < earliest) return d;
        return earliest;
      }, null as Date | null);
      const monthStart = startOfMonth(targetMonthStart || new Date());
      const monthEnd = endOfMonth(monthStart);

      const existingKRsSnapshot = await getDocs(krCollection);
      const existingMetricSnapshot = await getDocs(metricsCollection);

      existingKRsSnapshot.forEach(docSnapshot => {
        const kr = docSnapshot.data() as KeyResult;
        const deadline = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
        if (deadline >= monthStart && deadline <= monthEnd) {
          batch.delete(docSnapshot.ref);
          existingMetricSnapshot.forEach(metricDoc => {
            const metric = metricDoc.data() as any;
            if (metric.linkedKeyResultId === kr.id) {
              batch.delete(metricDoc.ref);
            }
          });
        }
      });

      const planMonth = format(monthStart, 'yyyy-MM');

      data.keyResults.forEach((kr: any) => {
        const newDocRef = doc(krCollection);
        const deadlineDate = new Date(kr.deadline);
        batch.set(newDocRef, { 
            ...kr, 
            id: newDocRef.id,
            target: Number(kr.target) || 0,
            unit: kr.unit || '',
            deadline: Timestamp.fromDate(isNaN(deadlineDate.getTime()) ? new Date() : deadlineDate),
            currentProgress: 0,
            planMonth
        });

        const metricDocRef = doc(metricsCollection);
        batch.set(metricDocRef, {
            id: metricDocRef.id,
            metric: kr.title,
            target: Number(kr.target) || 0,
            current: 0,
            unit: kr.unit || '',
            valuePerUnit: 0,
            linkedKeyResultId: newDocRef.id,
            planMonth,
            createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast({ title: 'Plan Activated', description: `${data.keyResults.length} Key Results and Metrics synced to dashboards.` });
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
                    className="flex-1 h-14 sm:h-16 border-2 border-dashed border-omuto-navy/20 hover:border-omuto-navy/40 rounded-xl sm:rounded-2xl"
                    onClick={() => append({ title: '', description: '', target: 0, unit: '', deadline: '', priority: 'Medium' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add Key Result
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
                <AlertTitle className="text-xs font-black uppercase tracking-widest">Plan-Per-Month</AlertTitle>
                <AlertDescription className="text-xs font-bold text-omuto-navy/70">
                    Activating this strategy will replace Key Results for the target month (based on your earliest deadline). Plans for other months are preserved.
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
        <div className="space-y-6 sm:space-y-8 w-full overflow-hidden">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 sm:gap-3 text-omuto-navy">
                    <div className="p-2 sm:p-3 bg-omuto-navy/10 rounded-xl sm:rounded-2xl">
                        <Goal className="h-6 w-6 sm:h-8 sm:w-8 text-omuto-red" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">Impact <span className="text-omuto-red">Strategy</span></h1>
                        <p className="text-omuto-navy/60 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest mt-0.5 sm:mt-1 truncate">Operational Objectives & Key Result Framework</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="view" className="w-full">
                <TabsList className="bg-omuto-navy/10 p-1 rounded-lg mb-4 sm:mb-6">
                    <TabsTrigger value="view" className="rounded-md font-bold text-xs uppercase tracking-wider px-3 py-1.5 data-[state=active]:bg-omuto-navy data-[state=active]:text-white data-[state=active]:shadow-sm">
                        View Plan
                    </TabsTrigger>
                    {canEdit && <TabsTrigger value="edit" className="rounded-md font-bold text-xs uppercase tracking-wider px-3 py-1.5 data-[state=active]:bg-omuto-navy data-[state=active]:text-white data-[state=active]:shadow-sm">
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
