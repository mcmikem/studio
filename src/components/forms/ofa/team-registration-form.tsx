'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OFATeam } from '@/lib/types';

const optionalNumber = () => z.preprocess((v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)), z.number().optional());

const teamSchema = z.object({
  teamName: z.string().min(2, 'Team name is required.'),
  subcounty: z.string().min(2, 'Subcounty is required.'),
  parish: z.string().optional(),
  village: z.string().optional(),
  headCoachName: z.string().optional(),
  headCoachPhone: z.string().optional(),
  assistantCoachName: z.string().optional(),
  assistantCoachPhone: z.string().optional(),
  captainName: z.string().optional(),
  captainPhone: z.string().optional(),
  yearOfEstablishment: z.preprocess((v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)), z.number().min(1960).max(new Date().getFullYear()).optional()),
  homePitchName: z.string().optional(),
  teamColours: z.string().optional(),
  motto: z.string().optional(),
  totalPlayers: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u13: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u15: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u17: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u19: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  percentageInSchool: optionalNumber().refine((v) => typeof v === 'undefined' || (v >= 0 && v <= 100), 'Must be between 0 and 100.'),
  communitySupport: z.enum(['Low', 'Moderate', 'Strong']).optional(),
  parentEngagement: z.enum(['Low', 'Moderate', 'Strong']).optional(),
  trainingDaysPerWeek: optionalNumber().refine((v) => typeof v === 'undefined' || (v >= 0 && v <= 7), 'Must be between 0 and 7.'),
  avgTrainingAttendance: optionalNumber().refine((v) => typeof v === 'undefined' || (v >= 0 && v <= 100), 'Must be between 0 and 100.'),
  mainAcademicChallenges: z.string().optional(),
  enforceSchoolAttendance: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

export function OFATeamRegistrationForm({ team, onSuccess }: { team?: OFATeam | null; onSuccess?: () => void }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema.omit({ id: true })),
  });

  // Effect to show validation errors to the user
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn("Form validation errors:", errors);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please check the form for missing or invalid fields.',
      });
    }
  }, [errors, toast]);

  useEffect(() => {
    if (!team) return;
    reset({
      teamName: team.teamName,
      subcounty: team.subcounty,
      parish: team.parish,
      village: team.village,
      headCoachName: team.headCoachName,
      headCoachPhone: team.headCoachPhone,
      assistantCoachName: team.assistantCoachName,
      assistantCoachPhone: team.assistantCoachPhone,
      captainName: team.captainName,
      captainPhone: team.captainPhone,
      yearOfEstablishment: team.yearOfEstablishment,
      homePitchName: team.homePitchName,
      teamColours: team.teamColours,
      motto: team.motto,
      totalPlayers: team.totalPlayers,
      u13: team.u13,
      u15: team.u15,
      u17: team.u17,
      u19: team.u19,
      percentageInSchool: team.percentageInSchool,
      communitySupport: team.communitySupport as 'Low' | 'Moderate' | 'Strong' | undefined,
      parentEngagement: team.parentEngagement as 'Low' | 'Moderate' | 'Strong' | undefined,
      trainingDaysPerWeek: team.trainingDaysPerWeek,
      avgTrainingAttendance: team.avgTrainingAttendance,
      enforceSchoolAttendance: team.enforceSchoolAttendance,
      mainAcademicChallenges: Array.isArray(team.mainAcademicChallenges)
        ? team.mainAcademicChallenges.join(', ')
        : team.mainAcademicChallenges,
    });
  }, [team, reset]);

  const onSubmit = async (data: TeamFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const payload = {
      ...data,
      mainAcademicChallenges: data.mainAcademicChallenges
        ? data.mainAcademicChallenges.split(',').map(v => v.trim()).filter(Boolean)
        : [],
      updatedAt: serverTimestamp(),
      ...(team ? {} : { createdAt: serverTimestamp(), createdBy: user.uid }),
    };

    try {
      if (team?.id) {
        await updateDocumentNonBlocking(doc(firestore, 'ofa-teams', team.id), payload);
        toast({ title: 'Team Updated', description: `${data.teamName} has been updated.` });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'ofa-teams'), payload);
        toast({ title: 'Team Registered', description: `${data.teamName} has been added.` });
        reset({});
      }
      onSuccess?.();
      if (!team) router.push('/meal/data/ofa/teams');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      {!team && (
        <Button variant="outline" asChild>
          <Link href="/meal/ofa"><ArrowLeft className="mr-2 h-4 w-4" />Back to OFA Hub</Link>
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Swords className="h-6 w-6" />{team ? 'Edit OFA Team' : 'OFA Team Registration'}</CardTitle>
          <CardDescription>Create or update a team profile, roster counts, and coaching information.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label htmlFor="teamName">Team Name</Label><Input id="teamName" {...register('teamName')} />{errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="subcounty">Subcounty</Label><Input id="subcounty" {...register('subcounty')} />{errors.subcounty && <p className="text-sm text-destructive">{errors.subcounty.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="parish">Parish</Label><Input id="parish" {...register('parish')} /></div>
              <div className="space-y-2"><Label htmlFor="village">Village</Label><Input id="village" {...register('village')} /></div>
              <div className="space-y-2"><Label htmlFor="homePitchName">Home Pitch</Label><Input id="homePitchName" {...register('homePitchName')} /></div>
              <div className="space-y-2"><Label htmlFor="yearOfEstablishment">Year Established</Label><Input id="yearOfEstablishment" type="number" {...register('yearOfEstablishment')} /></div>
              <div className="space-y-2"><Label htmlFor="teamColours">Team Colours</Label><Input id="teamColours" {...register('teamColours')} /></div>
              <div className="space-y-2"><Label htmlFor="motto">Motto</Label><Input id="motto" {...register('motto')} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="headCoachName">Head Coach</Label><Input id="headCoachName" {...register('headCoachName')} /></div>
              <div className="space-y-2"><Label htmlFor="headCoachPhone">Head Coach Phone</Label><Input id="headCoachPhone" {...register('headCoachPhone')} /></div>
              <div className="space-y-2"><Label htmlFor="assistantCoachName">Assistant Coach</Label><Input id="assistantCoachName" {...register('assistantCoachName')} /></div>
              <div className="space-y-2"><Label htmlFor="assistantCoachPhone">Assistant Coach Phone</Label><Input id="assistantCoachPhone" {...register('assistantCoachPhone')} /></div>
              <div className="space-y-2"><Label htmlFor="captainName">Captain Name</Label><Input id="captainName" {...register('captainName')} /></div>
              <div className="space-y-2"><Label htmlFor="captainPhone">Captain Phone</Label><Input id="captainPhone" {...register('captainPhone')} /></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2"><Label>Total</Label><Input type="number" {...register('totalPlayers')} /></div>
              <div className="space-y-2"><Label>U13</Label><Input type="number" {...register('u13')} /></div>
              <div className="space-y-2"><Label>U15</Label><Input type="number" {...register('u15')} /></div>
              <div className="space-y-2"><Label>U17</Label><Input type="number" {...register('u17')} /></div>
              <div className="space-y-2"><Label>U19</Label><Input type="number" {...register('u19')} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Community Support</Label><Controller name="communitySupport" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Low', 'Moderate', 'Strong'].map(v => <SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select>
              )} /></div>
              <div className="space-y-2"><Label>Parent Engagement</Label><Controller name="parentEngagement" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Low', 'Moderate', 'Strong'].map(v => <SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select>
              )} /></div>
              <div className="space-y-2"><Label>Training Days / Week</Label><Input type="number" {...register('trainingDaysPerWeek')} /></div>
              <div className="space-y-2"><Label>Avg Attendance %</Label><Input type="number" {...register('avgTrainingAttendance')} /></div>
              <div className="space-y-2 md:col-span-2"><Label>% Players in School</Label><Input type="number" {...register('percentageInSchool')} /></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainAcademicChallenges">Main Academic Challenges (comma separated)</Label>
              <Textarea id="mainAcademicChallenges" {...register('mainAcademicChallenges')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enforceSchoolAttendance">How school attendance is enforced</Label>
              <Textarea id="enforceSchoolAttendance" {...register('enforceSchoolAttendance')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {team ? 'Update Team' : 'Register Team'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
