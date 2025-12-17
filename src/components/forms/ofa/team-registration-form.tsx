
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { OFATeam } from '@/lib/types';
import { useEffect } from 'react';

const ageGroups = ["U-13", "U-15", "U-17", "U-19"];
const trainingDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mainAcademicChallenges = ["Fees", "Attendance", "Motivation", "Performance", "Distance", "None"];
const equipmentItems = ["Balls", "Jerseys", "Boots", "Cones/Markers", "Goal Nets", "First Aid Kit"];
const supportAreas = ["Football equipment", "Leadership & coaching workshop", "Academic support for players", "Mentorship & life-skills", "Team branding (logo/ID)", "Competition exposure", "Nutrition or welfare support"];

const teamRegistrationSchema = z.object({
  teamName: z.string().min(3, 'Team name is required.'),
  subcounty: z.string().min(3, 'Subcounty is required.'),
  parish: z.string().optional(),
  village: z.string().optional(),
  yearOfEstablishment: z.string().optional(),
  homePitchName: z.string().optional(),
  teamColours: z.string().optional(),
  motto: z.string().optional(),

  headCoachName: z.string().optional(),
  headCoachPhone: z.string().optional(),
  headCoachAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional(),
  headCoachAvailability: z.enum(['Full-Time', 'Part-Time']).optional(),

  assistantCoachName: z.string().optional(),
  assistantCoachPhone: z.string().optional(),
  assistantCoachAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional(),
  assistantCoachAvailability: z.enum(['Full-Time', 'Part-Time']).optional(),

  teamManagerName: z.string().optional(),
  teamManagerPhone: z.string().optional(),
  teamManagerAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional(),
  teamManagerAvailability: z.enum(['Full-Time', 'Part-Time']).optional(),

  captainName: z.string().optional(),
  captainPhone: z.string().optional(),
  captainAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional(),
  
  viceCaptainName: z.string().optional(),
  viceCaptainPhone: z.string().optional(),
  viceCaptainAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional(),

  trainingDaysPerWeek: z.coerce.number().optional(),
  avgTrainingAttendance: z.enum(['High', 'Medium', 'Low']).optional(),
  punctualityScore: z.coerce.number().min(1).max(5).optional(),
  disciplineScore: z.coerce.number().min(1).max(5).optional(),
  useWarmups: z.boolean().optional(),
  trackPlayerProgress: z.boolean().optional(),

  totalPlayers: z.coerce.number().optional(),
  u13: z.coerce.number().optional(),
  u15: z.coerce.number().optional(),
  u17: z.coerce.number().optional(),
  u19: z.coerce.number().optional(),
  percentageInSchool: z.coerce.number().optional(),
  mainAcademicChallenges: z.array(z.string()).optional(),
  enforceSchoolAttendance: z.enum(['Yes', 'No', 'Trying']).optional(),
  
  equipment: z.array(z.object({
    item: z.string(),
    qty: z.coerce.number().optional(),
    condition: z.enum(['Good', 'Worn', 'Poor']).optional(),
    needLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  })).optional(),

  needs: z.array(z.object({
    area: z.string(),
    priority: z.coerce.number().min(1).max(5).optional(),
  })).optional(),

  communitySupport: z.enum(['Yes', 'No', 'Sometimes']).optional(),
  parentEngagement: z.enum(['Yes', 'No', 'Weak Engagement']).optional(),
  hasVolunteers: z.boolean().optional(),
  volunteerCount: z.coerce.number().optional(),
  
  agreedToRules: z.boolean().refine(val => val === true, {
    message: 'You must agree to the OFA membership rules.',
  }),
});

type TeamRegistrationFormData = z.infer<typeof teamRegistrationSchema>;

type ManagementRole = 'Head Coach' | 'Assistant Coach' | 'Team Manager' | 'Captain' | 'Vice Captain';

const ManagementRow = ({ role, register, control }: { role: ManagementRole, register: any, control: any }) => {
    
    const getFieldName = (field: string): string => {
      const prefixMap: Record<string, string> = {
        'Head Coach': 'headCoach',
        'Assistant Coach': 'assistantCoach',
        'Team Manager': 'teamManager',
        'Captain': 'captain',
        'Vice Captain': 'viceCaptain'
      };
      const prefix = prefixMap[role];
      return `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    };
    
    return (
       <TableRow>
        <TableCell className="font-semibold">{role}</TableCell>
        <TableCell><Input {...register(getFieldName('name'))} /></TableCell>
        <TableCell><Input type="tel" {...register(getFieldName('phone'))} /></TableCell>
        <TableCell>
            <Controller name={getFieldName('attendance')} control={control} render={({field}) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Always">Always</SelectItem><SelectItem value="Sometimes">Sometimes</SelectItem><SelectItem value="Rare">Rare</SelectItem></SelectContent></Select>
            )} />
        </TableCell>
        {(role !== 'Captain' && role !== 'Vice Captain') && (
            <TableCell>
                 <Controller name={getFieldName('availability')} control={control} render={({field}) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Full-Time">Full-Time</SelectItem><SelectItem value="Part-Time">Part-Time</SelectItem></SelectContent></Select>
                )} />
            </TableCell>
        )}
       </TableRow>
    )
}

interface OFATeamRegistrationFormProps {
    team?: OFATeam | null;
    onSuccess?: () => void;
}


export function OFATeamRegistrationForm({ team, onSuccess }: OFATeamRegistrationFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditMode = !!team;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeamRegistrationFormData>({
    resolver: zodResolver(teamRegistrationSchema),
  });

  useEffect(() => {
    if (isEditMode && team) {
      reset(team);
    } else {
        reset({
          equipment: equipmentItems.map(item => ({ item, qty: 0, condition: 'Good', needLevel: 'Low' })),
          needs: supportAreas.map(area => ({ area, priority: 1 })),
          headCoachAttendance: 'Always',
          assistantCoachAttendance: 'Always',
          teamManagerAttendance: 'Always',
          captainAttendance: 'Always',
          viceCaptainAttendance: 'Always',
          headCoachAvailability: 'Full-Time',
          assistantCoachAvailability: 'Full-Time',
          teamManagerAvailability: 'Full-Time',
          avgTrainingAttendance: 'High',
          enforceSchoolAttendance: 'Yes',
          communitySupport: 'Yes',
          parentEngagement: 'Yes',
        });
    }
  }, [team, isEditMode, reset]);


  const onSubmit = async (data: TeamRegistrationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined && value !== null)
    );
    
    if (isEditMode && team) {
        const docRef = doc(firestore, 'ofa-teams', team.id);
        await updateDocumentNonBlocking(docRef, cleanedData);
        toast({ title: 'Team Updated!', description: `${data.teamName} has been updated.`});
        if (onSuccess) onSuccess();

    } else {
        const formData = { ...cleanedData, createdAt: serverTimestamp() };
        try {
          await addDocumentNonBlocking(collection(firestore, 'ofa-teams'), formData);
          toast({
            title: 'Team Registered!',
            description: `${data.teamName} has been successfully registered for the OFA.`,
          });
          reset();
           if (onSuccess) {
              onSuccess();
          } else {
              router.push('/meal/ofa');
          }
        } catch (error: any) {
          console.error("Submission Error:", error)
          toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        }
    }
  };

  return (
    <div className="space-y-4">
      {!isEditMode && (
         <Button variant="outline" asChild>
            <Link href="/meal/ofa">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to OFA Hub
            </Link>
        </Button>
      )}
      <Card>
        {!isEditMode && (
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Swords className="h-6 w-6" />
                    OFA Team Registration Form
                </CardTitle>
                <CardDescription>
                    Official onboarding form for teams joining the Omuto Football Alliance.
                </CardDescription>
            </CardHeader>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-6 space-y-8">
            {/* Section A */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Section A: Team Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="teamName">Team Name</Label><Input id="teamName" {...register('teamName')} />{errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="subcounty">Sub-county</Label><Input id="subcounty" {...register('subcounty')} />{errors.subcounty && <p className="text-sm text-destructive">{errors.subcounty.message}</p>}</div>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="parish">Parish</Label><Input id="parish" {...register('parish')} /></div>
                <div className="space-y-2"><Label htmlFor="village">Village/LC1</Label><Input id="village" {...register('village')} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Year Formed</Label><Input {...register('yearOfEstablishment')} /></div>
                <div className="space-y-2"><Label>Home Pitch Name + GPS</Label><Input {...register('homePitchName')} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Team Colours</Label><Input {...register('teamColours')} /></div>
                <div className="space-y-2"><Label>Motto / Values / Culture Statement (short answer)</Label><Input {...register('motto')} /></div>
              </div>
            </div>

            {/* Section B */}
            <div className="space-y-4">
               <h3 className="text-lg font-semibold border-b pb-2">Section B: Management Structure</h3>
               <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Attendance</TableHead>
                                <TableHead>Availability</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <ManagementRow role="Head Coach" register={register} control={control} />
                            <ManagementRow role="Assistant Coach" register={register} control={control} />
                            <ManagementRow role="Team Manager" register={register} control={control} />
                            <ManagementRow role="Captain" register={register} control={control} />
                            <ManagementRow role="Vice Captain" register={register} control={control} />
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Section C */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold border-b pb-2">Section C: Training Culture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Training Days Per Week</Label><Input type="number" {...register('trainingDaysPerWeek')} /></div>
                    <div className="space-y-2"><Label>Average Training Attendance</Label>
                        <Controller name="avgTrainingAttendance" control={control} render={({field}) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
                        )} />
                    </div>
                     <div className="space-y-2">
                        <Label>Punctuality Score (1-5)</Label>
                        <Controller name="punctualityScore" control={control} render={({field}) => (
                             <Slider defaultValue={[3]} min={1} max={5} step={1} onValueChange={(vals) => field.onChange(vals[0])} />
                        )} />
                    </div>
                      <div className="space-y-2">
                        <Label>Discipline Score (1-5)</Label>
                        <Controller name="disciplineScore" control={control} render={({field}) => (
                             <Slider defaultValue={[3]} min={1} max={5} step={1} onValueChange={(vals) => field.onChange(vals[0])} />
                        )} />
                    </div>
                    <div className="flex items-center space-x-2"><Controller name="useWarmups" control={control} render={({field}) => (<Checkbox id="useWarmups" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="useWarmups">Players use warm-ups &amp; drills?</Label></div>
                    <div className="flex items-center space-x-2"><Controller name="trackPlayerProgress" control={control} render={({field}) => (<Checkbox id="trackPlayerProgress" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="trackPlayerProgress">Team tracks player progress?</Label></div>
                </div>
            </div>
            
             {/* Section D */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Section D: Player Development & Education</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Total Players</Label><Input type="number" {...register('totalPlayers')} /></div>
                    <div className="space-y-2"><Label>U-13</Label><Input type="number" {...register('u13')} /></div>
                    <div className="space-y-2"><Label>U-15</Label><Input type="number" {...register('u15')} /></div>
                    <div className="space-y-2"><Label>U-17</Label><Input type="number" {...register('u17')} /></div>
                    <div className="space-y-2"><Label>U-19</Label><Input type="number" {...register('u19')} /></div>
                    <div className="space-y-2"><Label>% in School</Label><Input type="number" {...register('percentageInSchool')} /></div>
                </div>
                <div className="space-y-2">
                    <Label>Main Academic Challenges</Label>
                    <Controller name="mainAcademicChallenges" control={control} render={({field}) => (
                        <div className="flex flex-wrap gap-x-4 gap-y-2">{mainAcademicChallenges.map(item => (<div key={item} className="flex items-center space-x-2"><Checkbox id={`challenge-${item}`} checked={field.value?.includes(item)} onCheckedChange={checked => {return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter(v => v !== item))}} /><Label htmlFor={`challenge-${item}`}>{item}</Label></div>))}</div>
                    )} />
                </div>
                <div className="space-y-2"><Label>Does team enforce school attendance?</Label>
                    <Controller name="enforceSchoolAttendance" control={control} render={({field}) => (
                         <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="enforce-yes" /><Label htmlFor="enforce-yes">Yes</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="enforce-no" /><Label htmlFor="enforce-no">No</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Trying" id="enforce-trying" /><Label htmlFor="enforce-trying">Trying</Label></div>
                        </RadioGroup>
                    )} />
                </div>
            </div>

            {/* Section E */}
             <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Section E: Equipment & Resource Status</h3>
                <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Quantity</TableHead><TableHead>Condition</TableHead><TableHead>Need Level</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {equipmentItems.map((item, index) => (
                             <TableRow key={item}>
                                <TableCell className="font-semibold">{item}</TableCell>
                                <TableCell><Input type="number" {...register(`equipment.${index}.qty`)} /></TableCell>
                                <TableCell><Controller name={`equipment.${index}.condition`} control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Worn">Worn</SelectItem><SelectItem value="Poor">Poor</SelectItem></SelectContent></Select>)} /></TableCell>
                                <TableCell><Controller name={`equipment.${index}.needLevel`} control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select>)} /></TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {/* Section F */}
             <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Section F: Team Needs (1=Low, 5=Urgent)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {supportAreas.map((area, index) => (
                        <div key={area} className="space-y-2">
                             <Label>{area}</Label>
                            <Controller name={`needs.${index}.priority`} control={control} render={({field}) => (
                                <div className="flex items-center gap-4"><Slider defaultValue={[3]} min={1} max={5} step={1} onValueChange={(vals) => field.onChange(vals[0])} /><span className="font-bold w-12 text-center">{watch(`needs.${index}.priority`)}</span></div>
                            )} />
                        </div>
                    ))}
                </div>
             </div>

             {/* Section G */}
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Section G: Community & Volunteer Involvement</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Community Support</Label><Controller name="communitySupport" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Sometimes">Sometimes</SelectItem></SelectContent></Select>)} /></div>
                    <div className="space-y-2"><Label>Parent Engagement</Label><Controller name="parentEngagement" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Weak Engagement">Weak Engagement</SelectItem></SelectContent></Select>)} /></div>
                    <div className="space-y-2"><Label>Have local volunteers?</Label><Controller name="hasVolunteers" control={control} render={({field}) => (<RadioGroup onValueChange={(val) => field.onChange(val === 'true')} className="flex gap-4 pt-2"><RadioGroupItem value="true" id="v-yes" /><Label htmlFor="v-yes">Yes</Label><RadioGroupItem value="false" id="v-no" /><Label htmlFor="v-no">No</Label></RadioGroup>)} /></div>
                 </div>
                 {watch('hasVolunteers') && <div className="space-y-2 pt-2"><Label>How many volunteers?</Label><Input type="number" {...register('volunteerCount')} /></div>}
            </div>

            {/* Section H */}
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Section H: Agreement</h3>
                  <div className="flex items-center space-x-2">
                    <Controller name="agreedToRules" control={control} render={({ field }) => (
                        <Checkbox id="agreedToRules" checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                    <Label htmlFor="agreedToRules">Team commits to promote discipline, support player education, track attendance, and participate in OFA mentorship programs.</Label>
                </div>
                 {errors.agreedToRules && <p className="text-sm text-destructive">{errors.agreedToRules.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Register Team'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
