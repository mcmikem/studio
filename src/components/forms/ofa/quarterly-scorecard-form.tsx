'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
  month: z.string().min(1, "Month is required."),
});

type ScorecardFormData = z.infer<typeof scorecardSchema>;

export function QuarterlyScorecardForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams, isLoading: isLoadingTeams } = useCollection<OFATeam>(teamsQuery);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ScorecardFormData>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: {
      trainingAttendance: 3,
      coachingQuality: 3,
      playerDiscipline: 3,
      academicAttendance: 3,
      parentEngagement: 3,
      communityReputation: 3,
      month: format(new Date(), 'yyyy-MM'),
    },
  });

  const onSubmit = async (data: ScorecardFormData) => {
    if (!firestore) return;

    const teamName = teams?.find(t => t.id === data.teamId)?.teamName || 'Unknown Team';
    const formData = { ...data, teamName, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-scorecards'), formData);
      toast({
        title: 'Scorecard Submitted!',
        description: `The quarterly scorecard for ${teamName} has been recorded.`,
      });
      reset();
      router.push('/meal/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  const ScoreSlider = ({ name, label }: { name: keyof ScorecardFormData, label: string }) => {
    const value = watch(name as any);
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Controller
                name={name as any}
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-4">
                        <Slider
                        min={1} max={5} step={1}
                        defaultValue={[field.value as number]}
                        onValueChange={(value) => field.onChange(value[0])}
                        />
                        <span className="font-bold w-12 text-center">{field.value}</span>
                    </div>
                )}
            />
        </div>
    );
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
            <BarChart className="h-6 w-6" />
            OFA Team Quarterly Scorecard
          </CardTitle>
          <CardDescription>
            Evaluate a team's progress over the last quarter.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="teamId">Select Team</Label>
                    {isLoadingTeams ? <Skeleton className="h-10" /> : (
                        <Controller
                        name="teamId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="teamId"><SelectValue placeholder="Select a team..." /></SelectTrigger>
                            <SelectContent>
                                {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.teamName}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        )}
                        />
                    )}
                    {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="month">Report Month</Label>
                    <Input id="month" type="month" {...register('month')} />
                    {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <ScoreSlider name="trainingAttendance" label="Training Attendance" />
                <ScoreSlider name="coachingQuality" label="Coaching Quality" />
                <ScoreSlider name="playerDiscipline" label="Player Discipline" />
                <ScoreSlider name="academicAttendance" label="Academic Attendance" />
                <ScoreSlider name="parentEngagement" label="Parent Engagement" />
                <ScoreSlider name="communityReputation" label="Community Reputation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Achievements This Quarter</Label>
              <Textarea id="achievements" {...register('achievements')} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="challenges">Challenges This Quarter</Label>
              <Textarea id="challenges" {...register('challenges')} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="supportNeeded">Support Needed</Label>
              <Input id="supportNeeded" {...register('supportNeeded')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Quarterly Scorecard
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
