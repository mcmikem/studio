
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, getDocs, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Loader2, Wand, FileSignature, CheckCircle, Goal, Lock, MessageSquare } from 'lucide-react';
import { parseOperationalPlan } from '@/ai/flows/parse-operational-plan-flow';
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
        if (kr.title?.includes('KR1')) return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
        if (kr.target === 100) return `${kr.target}%`;
        return kr.target.toLocaleString();
    };
    
    const handleKRClick = (kr: KeyResult) => {
        setSelectedKR(kr);
        setIsSheetOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!keyResults || keyResults.length === 0) {
        return (
             <div className="text-center p-8 bg-muted rounded-lg">
                <div className="mx-auto h-12 w-12 text-muted-foreground"><Goal/></div>
                <h3 className="mt-4 text-lg font-semibold">No Active Operational Plan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    An administrator needs to upload the monthly or quarterly plan.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyResults.map(kr => {
              const progress = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;
              const deadlineDate = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
              const deadlinePast = isPast(deadlineDate);

              return (
                <Card 
                    key={kr.id} 
                    className="flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleKRClick(kr)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{kr.title}</CardTitle>
                         <ProgressRing progress={progress} size={40} strokeWidth={4} />
                    </div>
                    <CardDescription>{kr.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="text-sm space-y-1">
                        <p><span className="font-semibold">Target:</span> {formatTarget(kr)}</p>
                        <p className={deadlinePast ? 'text-destructive font-semibold' : ''}>
                          <span className="font-semibold">Deadline:</span> {formatDateSafe(kr.deadline, 'dateOnly')}
                        </p>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2 pt-2 border-t">
                            <MessageSquare className="h-3 w-3" /> Click to discuss
                        </div>
                     </div>
                  </CardContent>
                </Card>
              )
            })}
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader className="mb-6">
                        <SheetTitle>{selectedKR?.title}</SheetTitle>
                        <SheetDescription>
                            {selectedKR?.description}
                        </SheetDescription>
                    </SheetHeader>
                    {selectedKR && (
                        <div className="space-y-6">
                            <div className="space-y-2 text-sm bg-muted p-4 rounded-md">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Target:</span>
                                    <span>{formatTarget(selectedKR)}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="font-semibold">Current Progress:</span>
                                    <span>{selectedKR.currentProgress}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Deadline:</span>
                                    <span>{formatDateSafe(selectedKR.deadline, 'dateOnly')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Priority:</span>
                                    <span>{selectedKR.priority}</span>
                                </div>
                            </div>

                            <CommentsSection targetId={selectedKR.id} targetCollection="key-results" title="Discussion & Updates" />
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
      const result = await parseOperationalPlan({ planText: pastedText });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            Update Operational Plan
          </CardTitle>
          <CardDescription>
            Paste your monthly or quarterly plan below. The AI will extract Key Results (KRs) and update the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="plan-text"
              placeholder="Paste your full operational plan text here..."
              className="min-h-[250px] font-mono"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
             <Button onClick={handleParseWithAI} disabled={isParsing || !pastedText.trim()}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                Analyze Plan with AI
            </Button>
        </CardFooter>
      </Card>

      {parsedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Parsed Key Results</CardTitle>
            <CardDescription>
              Review carefully before saving. Saving will overwrite the current plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KR</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedResults.map((kr, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{kr.title}</TableCell>
                    <TableCell>{kr.description}</TableCell>
                    <TableCell>{kr.target}</TableCell>
                    <TableCell>{kr.deadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter>
             <Button onClick={handleSavePlan} disabled={isSaving} size="lg">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Save and Activate New Plan
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
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Operational Plan
                </h1>
                <p className="text-muted-foreground">
                    Strategic objectives and key results for the current period.
                </p>
            </header>

            <Tabs defaultValue="view" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="view">View Plan</TabsTrigger>
                    {canEdit && <TabsTrigger value="edit">Update Plan</TabsTrigger>}
                </TabsList>
                <TabsContent value="view" className="mt-6">
                    <OperationalPlanViewer />
                </TabsContent>
                {canEdit && (
                    <TabsContent value="edit" className="mt-6">
                        <OperationalPlanUpdater />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
