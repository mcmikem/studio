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

const optionalNumber = () =>
  z.preprocess(
    (v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)),
    z.number().optional()
  );

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
  yearOfEstablishment: z
    .preprocess(
      (v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)),
      z.number().min(1960).max(new Date().getFullYear()).optional()
    ),
  homePitchName: z.string().optional(),
  teamColours: z.string().optional(),
  motto: z.string().optional(),
  totalPlayers: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u13: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u15: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u17: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  u19: optionalNumber().refine((v) => typeof v === 'undefined' || v >= 0, 'Must be 0 or greater.'),
  percentageInSchool: optionalNumber().refine(
    (v) => typeof v === 'undefined' || (v >= 0 && v <= 100),
    'Must be between 0 and 100.'
  ),
  communitySupport: z.enum(['Low', 'Moderate', 'Strong']).optional(),
  parentEngagement: z.enum(['Low', 'Moderate', 'Strong']).optional(),
  trainingDaysPerWeek: optionalNumber().refine(
    (v) => typeof v === 'undefined' || (v >= 0 && v <= 7),
    'Must be between 0 and 7.'
  ),
  avgTrainingAttendance: optionalNumber().refine(
    (v) => typeof v === 'undefined' || (v >= 0 && v <= 100),
    'Must be between 0 and 100.'
  ),
  mainAcademicChallenges: z.string().optional(),
  enforceSchoolAttendance: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

export function OFATeamRegistrationForm({
  team,
  onSuccess,
}: {
  team?: OFATeam | null;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('Form validation errors:', errors);
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
      parish: team.parish ?? undefined,
      village: team.village ?? undefined,
      headCoachName: team.headCoachName ?? undefined,
      headCoachPhone: team.headCoachPhone ?? undefined,
      assistantCoachName: team.assistantCoachName ?? undefined,
      assistantCoachPhone: team.assistantCoachPhone ?? undefined,
      captainName: team.captainName ?? undefined,
      captainPhone: team.captainPhone ?? undefined,
      yearOfEstablishment: team.yearOfEstablishment ?? undefined,
      homePitchName: team.homePitchName ?? undefined,
      teamColours: team.teamColours ?? undefined,
      motto: team.motto ?? undefined,
      totalPlayers: team.totalPlayers ?? undefined,
      u13: team.u13 ?? undefined,
      u15: team.u15 ?? undefined,
      u17: team.u17 ?? undefined,
      u19: team.u19 ?? undefined,
      percentageInSchool: team.percentageInSchool ?? undefined,
      communitySupport: team.communitySupport as 'Low' | 'Moderate' | 'Strong' | undefined,
      parentEngagement: team.parentEngagement as 'Low' | 'Moderate' | 'Strong' | undefined,
      trainingDaysPerWeek: team.trainingDaysPerWeek ?? undefined,
      avgTrainingAttendance: team.avgTrainingAttendance ?? undefined,
      enforceSchoolAttendance: team.enforceSchoolAttendance ?? undefined,
      mainAcademicChallenges: Array.isArray(team.mainAcademicChallenges)
        ? team.mainAcademicChallenges.join(', ')
        : team.mainAcademicChallenges ?? undefined,
    });
  }, [team, reset]);

  const onSubmit = async (data: TeamFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit.' });
      return;
    }

    try {
      // 1. Process array fields safely
      const academicChallenges = typeof data.mainAcademicChallenges === 'string'
        ? data.mainAcademicChallenges
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
        : [];

      // 2. Build sanitized payload
      const payload = {
        ...data,
        mainAcademicChallenges: academicChallenges,
        updatedAt: serverTimestamp(),
        // Only add creation metadata if it's a new record
        ...(!team ? { createdAt: serverTimestamp(), createdBy: user.uid } : {}),
      };

      if (team?.id) {
        console.log('[OFATeam] Updating team:', team.id);
        await updateDocumentNonBlocking(doc(firestore, 'ofa-teams', team.id), payload);
        toast({ title: 'Team Updated', description: `${data.teamName} has been updated successfully.` });
      } else {
        console.log('[OFATeam] Creating new team');
        const docRef = await addDocumentNonBlocking(collection(firestore, 'ofa-teams'), payload);
        toast({ title: 'Team Registered', description: `${data.teamName} has been added to the registry.` });
        
        // Reset form for next entry if success
        reset();
      }
      
      onSuccess?.();
      if (!team) router.push('/meal/data/ofa/teams');
    } catch (error: any) {
      console.error('[OFATeam] Submission failed:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Submission Failed', 
        description: error.message || 'An unexpected error occurred. Please try again.' 
      });
    }
  };

  return (
    <div className="space-y-4">
      {!team && (
        <Button variant="outline" asChild>
          <Link href="/meal/ofa">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to OFA Hub
          </Link>
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6" />
            {team ? 'Edit OFA Team' : 'OFA Team Registration'}
          </CardTitle>
          <CardDescription>
            Create or update a team profile, roster counts, and coaching information.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* ... all your JSX fields exactly as before ... */}
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
