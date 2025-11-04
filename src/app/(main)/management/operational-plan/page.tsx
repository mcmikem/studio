
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useFirestore } from '@/firebase';
import { collection, writeBatch, getDocs } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Loader2, Wand, FileSignature, AlertTriangle, CheckCircle } from 'lucide-react';
import { parseOperationalPlan } from '@/ai/flows/parse-operational-plan-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OperationalPlanPage() {
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedResults, setParsedResults] = useState<Omit<KeyResult, 'id'>[]>([]);
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
      setParsedResults(result.keyResults);
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
      // Step 1: Delete all existing key results
      const existingDocsSnapshot = await getDocs(krCollection);
      existingDocsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Step 2: Add all new key results
      parsedResults.forEach(kr => {
        const newDocRef = doc(krCollection);
        batch.set(newDocRef, { ...kr, id: newDocRef.id });
      });

      // Step 3: Commit the batch
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
  
  const formatTarget = (kr: Partial<KeyResult>) => {
    if (kr.title?.includes('KR1')) return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
    if (kr.target === 100) return `${kr.target}%`;
    return kr.target?.toLocaleString();
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            Operational Plan Updater
          </CardTitle>
          <CardDescription>
            Paste your monthly or quarterly plan below. The AI will extract Key Results (KRs) and update the entire application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="plan-text"
              placeholder="Paste your full operational plan text here. Ensure it includes KR codes like 'OCT-KR1', descriptions, targets, and deadlines..."
              className="min-h-[250px] font-mono"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
          </div>
          <Button onClick={handleParseWithAI} disabled={isParsing || !pastedText.trim()}>
            {isParsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand className="mr-2 h-4 w-4" />
            )}
            Analyze Plan with AI
          </Button>
        </CardContent>
      </Card>

      {parsedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Parsed Key Results</CardTitle>
            <CardDescription>
              The AI has extracted the following Key Results from your text. Review them carefully before saving. Saving will overwrite the current plan.
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
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedResults.map((kr, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{kr.title}</TableCell>
                    <TableCell>{kr.description}</TableCell>
                    <TableCell>{formatTarget(kr)}</TableCell>
                    <TableCell>{kr.deadline}</TableCell>
                    <TableCell>{kr.priority}</TableCell>
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
