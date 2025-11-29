'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

const matchReportSchema = z.object({
  region: z.string().min(2, "Region is required."),
  teamA: z.string().min(2, 'Team A is required.'),
  teamB: z.string().min(2, 'Team B is required.'),
  finalScore: z.string().min(3, "Final score is required (e.g., 2 - 1)."),
  bestPerformers: z.string().optional(),
  injuries: z.enum(['Yes', 'No']),
  teamADiscipline: z.coerce.number().min(1).max(5),
  teamACards: z.string().optional(),
  teamBDiscipline: z.coerce.number().min(1).max(5),
  teamBCards: z.string().optional(),
  quickNotes: z.string().max(200).optional(),
});

type MatchReportFormData = z.infer<typeof matchReportSchema>;

export function MatchReportForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MatchReportFormData>({
    resolver: zodResolver(matchReportSchema),
    defaultValues: {
        injuries: 'No',
        teamADiscipline: 3,
        teamBDiscipline: 3,
    }
  });

  const onSubmit = async (data: MatchReportFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }
    // Re-structure to match OFAMatch schema
    const [homeScore, awayScore] = data.finalScore.split('-').map(s => parseInt(s.trim()));
    const logData = {
        date: format(new Date(), 'yyyy-MM-dd'),
        homeTeam: data.teamA,
        awayTeam: data.teamB,
        homeScore: isNaN(homeScore) ? 0 : homeScore,
        awayScore: isNaN(awayScore) ? 0 : awayScore,
        goalScorers: data.bestPerformers, // Simplified mapping
        cards: `Team A: ${data.teamACards || 'None'}, Team B: ${data.teamBCards || 'None'}`,
        // You might want to add other fields here
        createdAt: serverTimestamp()
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-matches'), logData);
      toast({
        title: 'Match Report Submitted!',
        description: `The result for ${data.teamA} vs ${data.teamB} has been recorded.`,
      });
      reset();
      router.push('/talents/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/talents/ofa">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to OFA Hub
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            OFA Match Summary Sheet
          </CardTitle>
          <CardDescription>
            Simplified report for District Meets.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Match Details</h3>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" {...register('region')} />
              {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="teamA">Team A</Label>
                    <Input id="teamA" {...register('teamA')} />
                    {errors.teamA && <p className="text-sm text-destructive">{errors.teamA.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="teamB">Team B</Label>
                    <Input id="teamB" {...register('teamB')} />
                    {errors.teamB && <p className="text-sm text-destructive">{errors.teamB.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="finalScore">Final Score (e.g., 2 - 1)</Label>
                    <Input id="finalScore" {...register('finalScore')} />
                    {errors.finalScore && <p className="text-sm text-destructive">{errors.finalScore.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Any Injuries?</Label>
                    <RadioGroup defaultValue="No" onValueChange={val => setValue('injuries', val as 'Yes' | 'No')} className="flex items-center gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="inj-yes" /><Label htmlFor="inj-yes">Yes</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="inj-no" /><Label htmlFor="inj-no">No</Label></div>
                    </RadioGroup>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="bestPerformers">Best 3 Performers (Optional)</Label>
                <Input id="bestPerformers" {...register('bestPerformers')} placeholder="e.g., Player 1, Player 2, Player 3" />
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Behaviour & Discipline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <Label className="font-semibold">Team A: {watch('teamA') || '...'}</Label>
                    <div className="space-y-2">
                        <Label>Discipline Score (1-5)</Label>
                        <Input type="number" min="1" max="5" {...register('teamADiscipline')} />
                    </div>
                     <div className="space-y-2">
                        <Label>Cards</Label>
                        <Input {...register('teamACards')} placeholder="e.g., 2 Yellow, 1 Red" />
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <Label className="font-semibold">Team B: {watch('teamB') || '...'}</Label>
                    <div className="space-y-2">
                        <Label>Discipline Score (1-5)</Label>
                        <Input type="number" min="1" max="5" {...register('teamBDiscipline')} />
                    </div>
                     <div className="space-y-2">
                        <Label>Cards</Label>
                        <Input {...register('teamBCards')} placeholder="e.g., 1 Yellow" />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="quickNotes">Quick Notes (max 40 words)</Label>
                <Textarea id="quickNotes" {...register('quickNotes')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Match Summary
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
