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
import { Loader2, FileSearch, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const advancedAnalysisSchema = z.object({
  homeTeam: z.string().min(2, 'Home team is required.'),
  awayTeam: z.string().min(2, 'Away team is required.'),
  homePossession: z.coerce.number().min(0).max(100).optional(),
  awayPossession: z.coerce.number().min(0).max(100).optional(),
  homeShots: z.coerce.number().min(0).optional(),
  awayShots: z.coerce.number().min(0).optional(),
  homeSaves: z.coerce.number().min(0).optional(),
  awaySaves: z.coerce.number().min(0).optional(),
  homePassSuccess: z.coerce.number().min(0).max(100).optional(),
  awayPassSuccess: z.coerce.number().min(0).max(100).optional(),
  homeFormation: z.string().optional(),
  homeStrengths: z.string().optional(),
  homeWeaknesses: z.string().optional(),
  homeAdjustments: z.string().optional(),
  awayFormation: z.string().optional(),
  awayStrengths: z.string().optional(),
  awayWeaknesses: z.string().optional(),
  awayAdjustments: z.string().optional(),
});

type AdvancedAnalysisFormData = z.infer<typeof advancedAnalysisSchema>;

export function OFAAdvancedAnalysisForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AdvancedAnalysisFormData>({
    resolver: zodResolver(advancedAnalysisSchema),
  });

  const onSubmit = async (data: AdvancedAnalysisFormData) => {
    if (!firestore) return;
    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-advanced-analysis'), logData);
      toast({
        title: 'Advanced Analysis Submitted!',
        description: `Analysis for ${data.homeTeam} vs ${data.awayTeam} has been recorded.`,
      });
      reset();
      router.push('/meal/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/ofa">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to OFA Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-6 w-6" />
            OFA Advanced Match Analysis
          </CardTitle>
          <CardDescription>
            Detailed report for finals or tournament stages.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Match Stats</h3>
             <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
              <span/>
              <Label className="text-center font-semibold">{watch('homeTeam') || 'Home'}</Label>
              <Label className="text-center font-semibold">{watch('awayTeam') || 'Away'}</Label>

              <Label>Possession %</Label>
              <Input type="number" {...register('homePossession')} />
              <Input type="number" {...register('awayPossession')} />
              
              <Label>Shots on Target</Label>
              <Input type="number" {...register('homeShots')} />
              <Input type="number" {...register('awayShots')} />

              <Label>Saves</Label>
              <Input type="number" {...register('homeSaves')} />
              <Input type="number" {...register('awaySaves')} />
              
              <Label>Pass Success %</Label>
              <Input type="number" {...register('homePassSuccess')} />
              <Input type="number" {...register('awayPassSuccess')} />
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Coaching Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">{watch('homeTeam') || 'Home Team'} Review</h4>
                <div className="space-y-2"><Label>Formation</Label><Input {...register('homeFormation')} /></div>
                <div className="space-y-2"><Label>Strengths</Label><Textarea {...register('homeStrengths')} /></div>
                <div className="space-y-2"><Label>Weaknesses</Label><Textarea {...register('homeWeaknesses')} /></div>
                <div className="space-y-2"><Label>Tactical Adjustments Needed</Label><Textarea {...register('homeAdjustments')} /></div>
              </div>
               <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">{watch('awayTeam') || 'Away Team'} Review</h4>
                <div className="space-y-2"><Label>Formation</Label><Input {...register('awayFormation')} /></div>
                <div className="space-y-2"><Label>Strengths</Label><Textarea {...register('awayStrengths')} /></div>
                <div className="space-y-2"><Label>Weaknesses</Label><Textarea {...register('awayWeaknesses')} /></div>
                <div className="space-y-2"><Label>Tactical Adjustments Needed</Label><Textarea {...register('awayAdjustments')} /></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Advanced Analysis
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
