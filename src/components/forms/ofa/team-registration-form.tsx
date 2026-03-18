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
import { Loader2, ArrowLeft, Swords, Users, MapPin, Trophy, GraduationCap, HeartPulse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationPicker } from '@/components/ui/location-picker';
import type { OFATeam } from '@/lib/types';

const optionalNumber = () =>
  z.preprocess(
    (v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)),
    z.number().optional()
  );

const teamSchema = z.object({
  teamName: z.string().min(2, 'Team name is required.'),
  district: z.string().min(1, 'District is required.'),
  subcounty: z.string().min(1, 'Subcounty is required.'),
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      communitySupport: 'Moderate',
      parentEngagement: 'Moderate',
      district: 'Wakiso',
    }
  });

  const watchDistrict = watch('district');
  const watchSubcounty = watch('subcounty');
  const watchParish = watch('parish');

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
      district: team.district ?? 'Wakiso',
      subcounty: team.subcounty ?? '',
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
          <CardContent className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Trophy className="h-5 w-5" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input id="teamName" {...register('teamName')} placeholder="e.g., Kasanje Lions FC" />
                  {errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearOfEstablishment">Year Established</Label>
                  <Input id="yearOfEstablishment" type="number" {...register('yearOfEstablishment')} placeholder="e.g., 2012" />
                  {errors.yearOfEstablishment && <p className="text-sm text-destructive">{errors.yearOfEstablishment.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamColours">Team Colours</Label>
                  <Input id="teamColours" {...register('teamColours')} placeholder="e.g., Red and White" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homePitchName">Home Pitch Name</Label>
                  <Input id="homePitchName" {...register('homePitchName')} placeholder="e.g., Kasanje Ground" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motto">Motto</Label>
                  <Input id="motto" {...register('motto')} placeholder="e.g., Excellence Through Sport" />
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" /> Location Details
              </h3>
              <LocationPicker
                districtValue={watchDistrict}
                subcountyValue={watchSubcounty}
                parishValue={watchParish}
                onDistrictChange={(val) => setValue('district', val)}
                onSubcountyChange={(val) => setValue('subcounty', val)}
                onParishChange={(val) => setValue('parish', val)}
              />
              <div className="space-y-2">
                <Label htmlFor="village">Village / Zone</Label>
                <Input id="village" {...register('village')} placeholder="Optional" />
              </div>
            </div>

            {/* Section 3: Coaching & Leadership */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" /> Coaching & Leadership
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headCoachName">Head Coach Name</Label>
                  <Input id="headCoachName" {...register('headCoachName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headCoachPhone">Head Coach Phone</Label>
                  <Input id="headCoachPhone" {...register('headCoachPhone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantCoachName">Assistant Coach Name</Label>
                  <Input id="assistantCoachName" {...register('assistantCoachName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantCoachPhone">Assistant Coach Phone</Label>
                  <Input id="assistantCoachPhone" {...register('assistantCoachPhone')} />
                </div>
                <div className="space-y-2 border-t pt-2 md:col-span-2">
                  <Label htmlFor="captainName">Team Captain Name</Label>
                  <Input id="captainName" {...register('captainName')} />
                </div>
              </div>
            </div>

            {/* Section 4: Roster & Schooling */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <GraduationCap className="h-5 w-5" /> Roster & Schooling
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Total Players</Label>
                  <Input type="number" {...register('totalPlayers')} />
                </div>
                <div className="space-y-2">
                  <Label>U13</Label>
                  <Input type="number" {...register('u13')} />
                </div>
                <div className="space-y-2">
                  <Label>U15</Label>
                  <Input type="number" {...register('u15')} />
                </div>
                <div className="space-y-2">
                  <Label>U17</Label>
                  <Input type="number" {...register('u17')} />
                </div>
                <div className="space-y-2">
                  <Label>U19</Label>
                  <Input type="number" {...register('u19')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>% of Players in School</Label>
                  <Input type="number" {...register('percentageInSchool')} placeholder="0-100" />
                </div>
                <div className="space-y-2">
                  <Label>School Attendance Enforcement</Label>
                  <Input {...register('enforceSchoolAttendance')} placeholder="e.g., Weekly card checks" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mainAcademicChallenges">Main Academic Challenges</Label>
                  <Textarea id="mainAcademicChallenges" {...register('mainAcademicChallenges')} placeholder="List challenges separated by commas..." />
                </div>
              </div>
            </div>

            {/* Section 5: Training & Community */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <HeartPulse className="h-5 w-5" /> Training & Community
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Training Days/Week</Label>
                    <Input type="number" {...register('trainingDaysPerWeek')} placeholder="0-7" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg Training Attendance %</Label>
                    <Input type="number" {...register('avgTrainingAttendance')} placeholder="0-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Community Support Level</Label>
                    <Controller
                      name="communitySupport"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="Strong">Strong</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Engagement Level</Label>
                    <Controller
                      name="parentEngagement"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="Strong">Strong</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
              </div>
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
