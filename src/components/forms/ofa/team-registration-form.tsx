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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, ArrowLeft, Swords, Users, MapPin, Trophy, GraduationCap, HeartPulse, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const teamIdFromUrl = searchParams.get('id');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const teamDocRef = useMemoFirebase(() => {
    if (!firestore || !teamIdFromUrl || team) return null;
    return doc(firestore, 'ofa-teams', teamIdFromUrl);
  }, [firestore, teamIdFromUrl, team]);
  const { data: teamDataFromUrl, isLoading: isTeamLoading } = useDoc<OFATeam>(teamDocRef);

  const effectiveTeam = team || teamDataFromUrl;
  const isEdit = !!effectiveTeam;

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
    if (!effectiveTeam) return;
    reset({
      teamName: effectiveTeam.teamName,
      district: effectiveTeam.district ?? 'Wakiso',
      subcounty: effectiveTeam.subcounty ?? '',
      parish: effectiveTeam.parish ?? undefined,
      village: effectiveTeam.village ?? undefined,
      headCoachName: effectiveTeam.headCoachName ?? undefined,
      headCoachPhone: effectiveTeam.headCoachPhone ?? undefined,
      assistantCoachName: effectiveTeam.assistantCoachName ?? undefined,
      assistantCoachPhone: effectiveTeam.assistantCoachPhone ?? undefined,
      captainName: effectiveTeam.captainName ?? undefined,
      captainPhone: effectiveTeam.captainPhone ?? undefined,
      yearOfEstablishment: effectiveTeam.yearOfEstablishment ?? undefined,
      homePitchName: effectiveTeam.homePitchName ?? undefined,
      teamColours: effectiveTeam.teamColours ?? undefined,
      motto: effectiveTeam.motto ?? undefined,
      totalPlayers: effectiveTeam.totalPlayers ?? undefined,
      u13: effectiveTeam.u13 ?? undefined,
      u15: effectiveTeam.u15 ?? undefined,
      u17: effectiveTeam.u17 ?? undefined,
      u19: effectiveTeam.u19 ?? undefined,
      percentageInSchool: effectiveTeam.percentageInSchool ?? undefined,
      communitySupport: effectiveTeam.communitySupport as 'Low' | 'Moderate' | 'Strong' | undefined,
      parentEngagement: effectiveTeam.parentEngagement as 'Low' | 'Moderate' | 'Strong' | undefined,
      trainingDaysPerWeek: effectiveTeam.trainingDaysPerWeek ?? undefined,
      avgTrainingAttendance: effectiveTeam.avgTrainingAttendance ?? undefined,
      enforceSchoolAttendance: effectiveTeam.enforceSchoolAttendance ?? undefined,
      mainAcademicChallenges: Array.isArray(effectiveTeam.mainAcademicChallenges)
        ? effectiveTeam.mainAcademicChallenges.join(', ')
        : effectiveTeam.mainAcademicChallenges ?? undefined,
    });
  }, [effectiveTeam, reset]);

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
      };

      if (effectiveTeam?.id) {
        console.log('[OFATeam] Updating team:', effectiveTeam.id);
        await updateDocumentNonBlocking(doc(firestore, 'ofa-teams', effectiveTeam.id), payload);
        toast({ title: 'Team Updated', description: `${data.teamName} has been updated successfully.` });
      } else {
        console.log('[OFATeam] Creating new team');
        const docRef = await addDocumentNonBlocking(collection(firestore, 'ofa-teams'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
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

      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-card border shadow-comic-sm rounded-2xl flex-shrink-0">
                    <Swords className="h-8 w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy">
                        OFA Team <span className="text-omuto-red">{isEdit ? 'Update' : 'Registration'}</span>
                    </CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-wider mt-2">
                        {isEdit ? `Updating profile for ${effectiveTeam?.teamName}` : 'Omuto Football Academy Strategic Registry'}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        {isTeamLoading ? (
            <CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
            {/* Section 1: Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Basic Information</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Team Name *</Label>
                  <Input id="teamName" {...register('teamName')} placeholder="e.g., Kasanje Lions FC" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                  {errors.teamName && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.teamName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearOfEstablishment" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Year Established</Label>
                  <Input id="yearOfEstablishment" type="number" {...register('yearOfEstablishment')} placeholder="e.g., 2012" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamColours" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Team Colours</Label>
                  <Input id="teamColours" {...register('teamColours')} placeholder="e.g., Red and White" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homePitchName" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Home Pitch Name</Label>
                  <Input id="homePitchName" {...register('homePitchName')} placeholder="e.g., Kasanje Ground" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="motto" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Motto</Label>
                  <Input id="motto" {...register('motto')} placeholder="e.g., Excellence Through Sport" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div className="space-y-6 pt-8 border-t border-dashed">
               <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Location Details</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <LocationPicker
                districtValue={watchDistrict}
                subcountyValue={watchSubcounty}
                parishValue={watchParish}
                onDistrictChange={(val) => setValue('district', val)}
                onSubcountyChange={(val) => setValue('subcounty', val)}
                onParishChange={(val) => setValue('parish', val)}
              />
              <div className="space-y-2">
                <Label htmlFor="village" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Village / Zone</Label>
                <Input id="village" {...register('village')} placeholder="Optional" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
              </div>
            </div>

            {/* Section 3: Coaching & Leadership */}
            <div className="space-y-6 pt-8 border-t border-dashed">
               <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Coaching & Leadership</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="headCoachName" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Head Coach Name</Label>
                  <Input id="headCoachName" {...register('headCoachName')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headCoachPhone" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Head Coach Phone</Label>
                  <Input id="headCoachPhone" {...register('headCoachPhone')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantCoachName" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Assistant Coach Name</Label>
                  <Input id="assistantCoachName" {...register('assistantCoachName')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantCoachPhone" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Assistant Coach Phone</Label>
                  <Input id="assistantCoachPhone" {...register('assistantCoachPhone')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2 sm:col-span-2 pt-4 border-t">
                  <Label htmlFor="captainName" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Team Captain Name</Label>
                  <Input id="captainName" {...register('captainName')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
              </div>
            </div>

            {/* Section 4: Roster & Schooling */}
            <div className="space-y-6 pt-8 border-t border-dashed">
               <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Roster & Schooling</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Total</Label>
                  <Input type="number" {...register('totalPlayers')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">U13</Label>
                  <Input type="number" {...register('u13')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">U15</Label>
                  <Input type="number" {...register('u15')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">U17</Label>
                  <Input type="number" {...register('u17')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">U19</Label>
                  <Input type="number" {...register('u19')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">% in School</Label>
                  <Input type="number" {...register('percentageInSchool')} placeholder="0-100" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Enforcement</Label>
                  <Input {...register('enforceSchoolAttendance')} placeholder="e.g., Weekly checks" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mainAcademicChallenges" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Academic Challenges</Label>
                  <Textarea id="mainAcademicChallenges" {...register('mainAcademicChallenges')} placeholder="List challenges separated by commas..." className="min-h-[100px] rounded-2xl border-lg p-4 font-bold text-omuto-navy bg-white dark:bg-omuto-navy" />
                </div>
              </div>
            </div>

            {/* Section 5: Training & Community */}
            <div className="space-y-6 pt-8 border-t border-dashed">
               <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Training & Community</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Weekly Sessions</Label>
                    <Input type="number" {...register('trainingDaysPerWeek')} placeholder="0-7" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Attendance %</Label>
                    <Input type="number" {...register('avgTrainingAttendance')} placeholder="0-100" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Community Support</Label>
                    <Controller
                      name="communitySupport"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy"><SelectValue /></SelectTrigger>
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
                    <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Parent Engagement</Label>
                    <Controller
                      name="parentEngagement"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy"><SelectValue /></SelectTrigger>
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
          <CardFooter className="p-4 sm:p-6 lg:p-8 bg-muted/30 border-t border-omuto-navy/10">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-16 bg-omuto-navy text-white border-white shadow-comic-sm rounded-2xl uppercase tracking-widest font-black text-sm">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isEdit ? <Save className="mr-2 h-5 w-5" /> : null)}
              {isEdit ? 'Update Team Details' : 'Register Team'}
            </Button>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
}
