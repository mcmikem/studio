
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

const playerSchema = z.object({
  fullName: z.string().min(3, 'Player name is required.'),
  team: z.string().min(2, 'Team name is required.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  jerseyNumber: z.coerce.number().min(1, 'Jersey number is required.'),
  photoUrl: z.string().url().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export function PlayerRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
        position: 'MID',
    }
  });

  const onSubmit = async (data: PlayerFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-players'), logData);
      toast({
        title: 'Player Registered!',
        description: `${data.fullName} has been added to the league.`,
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
            OFA Player Registration
          </CardTitle>
          <CardDescription>
            Register a new player for a team in the Omuto Football Alliance.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Player's Full Name</Label>
                    <Input id="fullName" {...register('fullName')} />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Input id="team" {...register('team')} />
                    {errors.team && <p className="text-sm text-destructive">{errors.team.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" {...register('dob')} />
                    {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="jerseyNumber">Jersey Number</Label>
                    <Input id="jerseyNumber" type="number" {...register('jerseyNumber')} />
                    {errors.jerseyNumber && <p className="text-sm text-destructive">{errors.jerseyNumber.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                   <Controller
                    name="position"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Select position..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GK">Goalkeeper (GK)</SelectItem>
                          <SelectItem value="DEF">Defender (DEF)</SelectItem>
                          <SelectItem value="MID">Midfielder (MID)</SelectItem>
                           <SelectItem value="FWD">Forward (FWD)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
                </div>
             <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
                <Input id="photoUrl" {...register('photoUrl')} placeholder="Link to player photo"/>
                {errors.photoUrl && <p className="text-sm text-destructive">{errors.photoUrl.message}</p>}
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
