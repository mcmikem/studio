
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, writeBatch, getDocs, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Loader2, Wand, FileSignature, CheckCircle, Goal, MessageSquare, Target, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { runParseOperationalPlan } from '@/ai/actions';
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
import { formatDateSafe } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';
import { isPast } from 'date-fns';
import { CommentsSection } from '@/components/ui/comments';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton import

interface ParsedKeyResult extends Omit<KeyResult, 'id' | 'deadline'> {
  deadline: string;
}

function OperationalPlanViewer() {
    const firestore = useFirestore();
    const keyResultsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(collection(db, 'key-results'), orderBy('priority'), orderBy('deadline'));
    }, [firestore]);

    const { data: keyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);
    const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const formatTarget = (kr: KeyResult) => {
        if (kr.title?.includes('KR1') || kr.description?.toLowerCase().includes('ugx')) return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
        if (kr.target === 100) return `${kr.target}%`;
        return kr.target.toLocaleString();
    };
    
    const handleKRClick = (kr: KeyResult) => {
        setSelectedKR(kr);
        setIsSheetOpen(true);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        );
    }

    if (!keyResults || keyResults.length === 0) {
        return (
             <Card>
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-white border-lg border-omuto-navy/20 rounded-2xl shadow-comic-sm mb-6"><Goal className="h-12 w-12 text-omuto-navy/30" /></div>
                    <h3 className="text-2xl font-bold tracking-tighter uppercase text-omuto-navy">No Active Plan</h3>
                    <p className="max-w-xs text-omuto-navy/60 font-bold mt-2 uppercase text-[10px] tracking-widest leading-relaxed">
                        An administrator needs to upload the strategic objectives for this period.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyResults.map(kr => {
              const progress = kr.target > 0 ? Math.min(100, Math.round((kr.currentProgress / kr.target) * 100)) : 0;
              const deadlineDate = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
              const deadlinePast = isPast(deadlineDate);

              return (
                <Card 
                    key={kr.id} 
                    className="group relative overflow-hidden hover:-translate-y-1"
                    onClick={() => handleKRClick(kr)}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="h-20 w-20 text-omuto-navy/10" />
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-4">
                         <Badge className={`badge-omuto-outline ${kr.priority === 'High' ? 'border-omuto-red/30 text-omuto-red' : 'border-omuto-navy/20 text-omuto-navy/70'}`}>
                            {kr.priority} Priority
                        </Badge>
                         <ProgressRing progress={progress} size={48} strokeWidth={5} />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight leading-tight text-omuto-navy group-hover:text-primary transition-colors">{kr.title}</CardTitle>
                    <CardDescription className="font-bold line-clamp-2 mt-1 text-omuto-navy/70">{kr.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-omuto-navy/60 tracking-widest">
                            <span>Progress</span>
                            <span className="text-primary">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-omuto-navy/10">
                            <div 
                                className="h-full bg-primary rounded-full transition-all duration-1000" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                     </div>

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
                  <CardFooter className="pt-0 pb-6">
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-lg w-full justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <MessageSquare className="h-3.5 w-3.5" /> Open Strategy Discussion
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl rounded-l-3xl border-l-lg border-omuto-navy/20 shadow-lg">
                    <SheetHeader className="mb-8 pt-6">
                        <Badge className="badge-omuto-outline mb-4 text-omuto-navy/60">KEY RESULT DETAIL</Badge>
                        <SheetTitle className="text-3xl font-bold tracking-tight text-omuto-navy">{selectedKR?.title}</SheetTitle>
                        <SheetDescription className="text-md font-bold leading-relaxed text-omuto-navy/70">
                            {selectedKR?.description}
                        </SheetDescription>
                    </SheetHeader>
                    {selectedKR && (
                        <div className="space-y-8 h-full flex flex-col pb-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-primary/10 rounded-2xl border-lg border-omuto-navy/20">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Target Goal</p>
                                    <p className="text-2xl font-bold text-omuto-navy">{formatTarget(selectedKR)}</p>
                                </div>
                                <div className="p-5 bg-muted/30 border-lg border-omuto-navy/20 rounded-2xl">
                                    <p className="text-[10px] font-black text-omuto-navy/50 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Due Date</p>
                                    <p className="text-xl font-bold text-omuto-navy">{formatDateSafe(selectedKR.deadline, 'dateOnly')}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col border-t-lg border-omuto-navy/10 pt-8">
                                <CommentsSection targetId={selectedKR.id} targetCollection="key-results" title="Discussion & Team Updates" />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function OperationalPlanUpdater() {
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedResults, setParsedResults] = useState<ParsedKeyResult[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleParseWithAI = async () => {
    if (!pastedText.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Text Provided',
        description: 'Please paste your operational plan into the text area.',
      });
      return;
    }
    setIsParsing(true);
    setParsedResults([]);
    try {
      const result = await runParseOperationalPlan({ planText: pastedText });
      setParsedResults(result.keyResults as ParsedKeyResult[]);
      toast({
        title: 'Plan Parsed Successfully',
        description: `Found ${result.keyResults.length} Key Results. Please review them below.`,
      });
    } catch (error) {
      console.error('AI parsing error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Parsing Failed',
        description: 'The AI could not understand the provided text. Please check the format and try again.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSavePlan = async () => {
    if (parsedResults.length === 0 || !firestore) {
      toast({
        variant: 'destructive',
        title: 'No Results to Save',
        description: 'Please parse a plan before saving.',
      });
      return;
    }
    setIsSaving(true);
    const krCollection = collection(firestore, 'key-results');
    const batch = writeBatch(firestore);

    try {
      const existingDocsSnapshot = await getDocs(krCollection);
      existingDocsSnapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
      });

      parsedResults.forEach(kr => {
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

      toast({
        title: 'Operational Plan Updated!',
        description: `Successfully saved ${parsedResults.length} new Key Results. Your dashboard is now up-to-date.`,
      });
      setParsedResults([]);
      setPastedText('');
    } catch (error) {
      console.error('Error saving new plan:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not update the operational plan in the database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 pb-10 pt-10 px-8">
            <div className="p-3 bg-white border-lg border-omuto-navy/20 shadow-comic-sm rounded-2xl w-fit mb-4 rotate-[-2deg]">
                <FileSignature className="h-6 w-6 text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold tracking-tighter uppercase text-omuto-navy">Strategy <span className="text-primary">Input</span></CardTitle>
          <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-[0.2em] mt-2">
            Paste your raw operational plan text. Omuto AI will extract structured Key Results and activate the trackers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 -mt-6">
          <div className="space-y-2 relative">
            <Textarea
              id="plan-text"
              placeholder="E.g. KR1: Fundraising 150M by April. KR2: Support 2000 girls in RED Campaign..."
              className="min-h-[300px] border-lg rounded-2xl border-omuto-navy/20 p-6 text-sm focus-visible:ring-primary shadow-inner bg-omuto-cream/50"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
             <div className="absolute bottom-4 right-4">
                <Button onClick={handleParseWithAI} disabled={isParsing || !pastedText.trim()} className="btn-omuto shadow-comic-lg hover:shadow-comic-sm h-12 text-xs">
                    {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-omuto-yellow" />}
                    Analyze & Structure
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {parsedResults.length > 0 && (
        <Card className="bg-white overflow-hidden">
          <CardHeader className="px-8 pt-8 bg-muted/10 border-b-lg border-omuto-navy/10">
            <CardTitle className="text-2xl font-bold tracking-tighter text-omuto-navy">Extracted <span className="text-primary">Strategy Model</span></CardTitle>
            <CardDescription className="font-bold text-omuto-navy/50 mt-1">Review the structured data below. Saving will overwrite the previous organizational plan.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="data-table-omuto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-white/90">Key Result</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-white/90">Description</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-white/90 text-right">Target</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {parsedResults.map((kr, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-bold text-sm text-omuto-navy">{kr.title}</TableCell>
                        <TableCell className="text-xs font-bold text-omuto-navy/70 leading-relaxed">{kr.description}</TableCell>
                        <TableCell className="text-right font-bold text-omuto-navy">{kr.target}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
           <CardFooter className="p-8 bg-muted/10 border-t-lg border-omuto-navy/10">
             <Button onClick={handleSavePlan} disabled={isSaving} className="btn-omuto w-full h-14 text-sm shadow-comic-lg hover:shadow-comic-sm bg-primary border-white text-white">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Activate Organizational Strategy
            </Button>
          </CardFooter>
        </Card>
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
