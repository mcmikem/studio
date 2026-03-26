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
      <Button variant="outline" asChild className="rounded-xl">
        <Link href="/meal/ofa">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to OFA Hub
        </Link>
      </Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-card border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <FileSearch className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                Advanced <span className="text-omuto-red">Analysis</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                Match Analytics Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <h3 className="text-lg font-semibold border-b pb-2">Match Stats</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="homeTeam">Home Team</Label>
                    <Input id="homeTeam" {...register('homeTeam')} className="h-10 sm:h-11" />
                    {errors.homeTeam && <p className="text-xs sm:text-sm text-destructive">{errors.homeTeam.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="awayTeam">Away Team</Label>
                    <Input id="awayTeam" {...register('awayTeam')} className="h-10 sm:h-11" />
                    {errors.awayTeam && <p className="text-xs sm:text-sm text-destructive">{errors.awayTeam.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <span/>
              <Label className="text-center font-semibold">{watch('homeTeam') || 'Home'}</Label>
              <Label className="text-center font-semibold">{watch('awayTeam') || 'Away'}</Label>

              <Label>Possession %</Label>
              <Input type="number" {...register('homePossession')} className="h-10 sm:h-11" />
              <Input type="number" {...register('awayPossession')} className="h-10 sm:h-11" />
              
              <Label>Shots on Target</Label>
              <Input type="number" {...register('homeShots')} className="h-10 sm:h-11" />
              <Input type="number" {...register('awayShots')} className="h-10 sm:h-11" />

              <Label>Saves</Label>
              <Input type="number" {...register('homeSaves')} className="h-10 sm:h-11" />
              <Input type="number" {...register('awaySaves')} className="h-10 sm:h-11" />
              
              <Label>Pass Success %</Label>
              <Input type="number" {...register('homePassSuccess')} className="h-10 sm:h-11" />
              <Input type="number" {...register('awayPassSuccess')} className="h-10 sm:h-11" />
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Coaching Review</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">{watch('homeTeam') || 'Home Team'} Review</h4>
                <div className="space-y-2"><Label>Formation</Label><Input {...register('homeFormation')} className="h-10 sm:h-11" /></div>
                <div className="space-y-2"><Label>Strengths</Label><Textarea {...register('homeStrengths')} className="min-h-[80px] sm:min-h-[100px]" /></div>
                <div className="space-y-2"><Label>Weaknesses</Label><Textarea {...register('homeWeaknesses')} className="min-h-[80px] sm:min-h-[100px]" /></div>
                <div className="space-y-2"><Label>Tactical Adjustments Needed</Label><Textarea {...register('homeAdjustments')} className="min-h-[80px] sm:min-h-[100px]" /></div>
              </div>
               <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">{watch('awayTeam') || 'Away Team'} Review</h4>
                <div className="space-y-2"><Label>Formation</Label><Input {...register('awayFormation')} className="h-10 sm:h-11" /></div>
                <div className="space-y-2"><Label>Strengths</Label><Textarea {...register('awayStrengths')} className="min-h-[80px] sm:min-h-[100px]" /></div>
                <div className="space-y-2"><Label>Weaknesses</Label><Textarea {...register('awayWeaknesses')} className="min-h-[80px] sm:min-h-[100px]" /></div>
                <div className="space-y-2"><Label>Tactical Adjustments Needed</Label><Textarea {...register('awayAdjustments')} className="min-h-[80px] sm:min-h-[100px]" /></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Advanced Analysis
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
