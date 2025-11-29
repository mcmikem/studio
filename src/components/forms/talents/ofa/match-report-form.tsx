
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
  date: z.string().min(1, 'Date is required.'),
  homeTeam: z.string().min(2, 'Home team is required.'),
  awayTeam: z.string().min(2, 'Away team is required.'),
  homeScore: z.coerce.number().min(0, 'Score must be 0 or greater.'),
  awayScore: z.coerce.number().min(0, 'Score must be 0 or greater.'),
  goalScorers: z.string().optional(),
  cards: z.string().optional(),
  referee: z.string().optional(),
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
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: MatchReportFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-matches'), logData);
      toast({
        title: 'Match Report Submitted!',
        description: `The result for ${data.homeTeam} vs ${data.awayTeam} has been recorded.`,
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
            OFA Match Report Form
          </CardTitle>
          <CardDescription>
            Log the results and details of a completed match.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="date">Date of Match</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="homeTeam">Home Team</Label>
                    <Input id="homeTeam" {...register('homeTeam')} />
                    {errors.homeTeam && <p className="text-sm text-destructive">{errors.homeTeam.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="awayTeam">Away Team</Label>
                    <Input id="awayTeam" {...register('awayTeam')} />
                    {errors.awayTeam && <p className="text-sm text-destructive">{errors.awayTeam.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="homeScore">Home Score</Label>
                    <Input id="homeScore" type="number" {...register('homeScore')} />
                    {errors.homeScore && <p className="text-sm text-destructive">{errors.homeScore.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="awayScore">Away Score</Label>
                    <Input id="awayScore" type="number" {...register('awayScore')} />
                    {errors.awayScore && <p className="text-sm text-destructive">{errors.awayScore.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="goalScorers">Goal Scorers (Optional)</Label>
                <Textarea id="goalScorers" {...register('goalScorers')} placeholder="e.g., John Doe (2), Jane Smith (1)" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="cards">Yellow/Red Cards (Optional)</Label>
                <Textarea id="cards" {...register('cards')} placeholder="e.g., Player A (Yellow), Player B (Red)" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="referee">Referee Name (Optional)</Label>
                <Input id="referee" {...register('referee')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Match Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    