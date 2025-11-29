'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const playerSchema = z.object({
  name: z.string().min(3, 'Player name is required.'),
  ageCategory: z.enum(["U13", "U15", "U17", "U19"]),
  teamId: z.string().min(1, 'Please select the team.'),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  speed: z.number().min(1).max(5),
  ballControl: z.number().min(1).max(5),
  passing: z.number().min(1).max(5),
  gameAwareness: z.number().min(1).max(5),
  teamwork: z.number().min(1).max(5),
  attitude: z.number().min(1).max(5),
  attendance: z.enum(['Good', 'Fair', 'Poor']),
  performanceTrend: z.enum(['Improving', 'Stable', 'Declining']),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const StarRating = ({ name, label, control }: { name: any, label: string, control: any }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`cursor-pointer h-6 w-6 transition-colors ${field.value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
              onClick={() => field.onChange(star)}
            />
          ))}
        </div>
      )}
    />
  </div>
);


export function PlayerRegistrationForm() {
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
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
        ageCategory: 'U15',
        speed: 3,
        ballControl: 3,
        passing: 3,
        gameAwareness: 3,
        teamwork: 3,
        attitude: 3,
        attendance: 'Good',
        performanceTrend: 'Stable',
    }
  });

  const onSubmit = async (data: PlayerFormData) => {
    if (!firestore) return;
    const teamName = teams?.find(t => t.id === data.teamId)?.teamName || 'Unknown';
    const logData = { ...data, teamName, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-players'), logData);
      toast({
        title: 'Player Registered!',
        description: `${data.name} has been added to ${teamName}.`,
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
            <UserPlus className="h-6 w-6" />
            OFA Player Registration & Development Form (2025)
          </CardTitle>
          <CardDescription>
            Create a player profile for database and talent tracking.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Section 1 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Player Bio</h3>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Age Category</Label>
                        <Controller name="ageCategory" control={control} render={({field}) => (
                           <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="U13">U-13</SelectItem><SelectItem value="U15">U-15</SelectItem><SelectItem value="U17">U-17</SelectItem><SelectItem value="U19">U-19</SelectItem></SelectContent></Select>
                        )} />
                    </div>
                     <div className="space-y-2">
                        <Label>Team</Label>
                         {isLoadingTeams ? <Skeleton className="h-10" /> : <Controller name="teamId" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select team..." /></SelectTrigger><SelectContent>{teams?.map(t => <SelectItem value={t.id} key={t.id}>{t.teamName}</SelectItem>)}</SelectContent></Select>)} />}
                         {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="school">School</Label>
                        <Input id="school" {...register('school')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Input id="class" {...register('class')} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input id="guardianContact" {...register('guardianContact')} />
                </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Football Skills Assessment (1-5)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <StarRating name="speed" label="Speed" control={control} />
                    <StarRating name="ballControl" label="Ball Control" control={control} />
                    <StarRating name="passing" label="Passing" control={control} />
                    <StarRating name="gameAwareness" label="Game Awareness" control={control} />
                    <StarRating name="teamwork" label="Teamwork" control={control} />
                    <StarRating name="attitude" label="Attitude" control={control} />
                </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Education & Life</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>School Attendance</Label>
                        <Controller name="attendance" control={control} render={({field}) => (
                           <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem></SelectContent></Select>
                        )} />
                    </div>
                    <div className="space-y-2">
                        <Label>Academic Performance Trend</Label>
                        <Controller name="performanceTrend" control={control} render={({field}) => (
                           <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Improving">Improving</SelectItem><SelectItem value="Stable">Stable</SelectItem><SelectItem value="Declining">Declining</SelectItem></SelectContent></Select>
                        )} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="careerDream">Career Dream</Label>
                    <Input id="careerDream" {...register('careerDream')} />
                </div>
            </div>

             {/* Section 4 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Quarterly Goals</h3>
                 <div className="space-y-2">
                    <Label htmlFor="skillGoal">Skill Goal</Label>
                    <Input id="skillGoal" {...register('skillGoal')} placeholder="e.g., Improve my weak foot"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="schoolGoal">School Goal</Label>
                    <Input id="schoolGoal" {...register('schoolGoal')} placeholder="e.g., Achieve 80% attendance" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="behaviourGoal">Behaviour Goal</Label>
                    <Input id="behaviourGoal" {...register('behaviourGoal')} placeholder="e.g., Be a better teammate" />
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Player
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
