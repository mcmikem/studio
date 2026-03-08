'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { OFATeam } from '@/lib/types';

const scorecardSchema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  trainingAttendance: z.number().min(1).max(5),
  coachingQuality: z.number().min(1).max(5),
  playerDiscipline: z.number().min(1).max(5),
  academicAttendance: z.number().min(1).max(5),
  parentEngagement: z.number().min(1).max(5),
  communityReputation: z.number().min(1).max(5),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  supportNeeded: z.string().optional(),
  month: z.string().min(1, 'Month is required.'),
});

type ScorecardFormData = z.infer<typeof scorecardSchema>;

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label>{label}</Label><span className="text-sm font-medium">{value}/5</span></div>
      <Slider min={1} max={5} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export function QuarterlyScorecardForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams, isLoading: teamsLoading } = useCollection<OFATeam>(teamsQuery);

  const { handleSubmit, control, register, formState: { errors, isSubmitting }, reset } = useForm<ScorecardFormData>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: {
      month: format(new Date(), 'yyyy-MM'),
      trainingAttendance: 3,
      coachingQuality: 3,
      playerDiscipline: 3,
      academicAttendance: 3,
      parentEngagement: 3,
      communityReputation: 3,
    },
  });

  const onSubmit = async (data: ScorecardFormData) => {
    if (!firestore) return;
    const teamName = teams?.find((t) => t.id === data.teamId)?.teamName || '';
    const averageScore = (data.trainingAttendance + data.coachingQuality + data.playerDiscipline + data.academicAttendance + data.parentEngagement + data.communityReputation) / 6;

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-quarterly-scorecards'), {
        ...data,
        teamName,
        averageScore: Number(averageScore.toFixed(2)),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Scorecard Saved', description: `Scorecard for ${teamName || 'team'} submitted.` });
      reset();
      router.push('/meal/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild><Link href="/meal/ofa"><ArrowLeft className="mr-2 h-4 w-4" />Back to OFA Hub</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart className="h-6 w-6" /> Quarterly Team Scorecard</CardTitle>
          <CardDescription>Rate key performance dimensions and track team development by month.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team</Label>
                {teamsLoading ? <Skeleton className="h-10 w-full" /> : (
                  <Controller name="teamId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.teamName}</SelectItem>)}</SelectContent></Select>
                  )} />
                )}
                {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="month">Month</Label><input id="month" type="month" className="w-full h-10 rounded-md border px-3" {...register('month')} /></div>
            </div>

            {[
              ['trainingAttendance', 'Training Attendance'],
              ['coachingQuality', 'Coaching Quality'],
              ['playerDiscipline', 'Player Discipline'],
              ['academicAttendance', 'Academic Attendance'],
              ['parentEngagement', 'Parent Engagement'],
              ['communityReputation', 'Community Reputation'],
            ].map(([name, label]) => (
              <Controller
                key={name}
                name={name as keyof ScorecardFormData}
                control={control}
                render={({ field }) => <ScoreSlider label={label} value={field.value as number} onChange={field.onChange} />}
              />
            ))}

            <div className="space-y-2"><Label htmlFor="achievements">Major Achievements</Label><Textarea id="achievements" {...register('achievements')} /></div>
            <div className="space-y-2"><Label htmlFor="challenges">Major Challenges</Label><Textarea id="challenges" {...register('challenges')} /></div>
            <div className="space-y-2"><Label htmlFor="supportNeeded">Support Needed Next Quarter</Label><Textarea id="supportNeeded" {...register('supportNeeded')} /></div>
          </CardContent>
          <CardFooter><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Scorecard</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
