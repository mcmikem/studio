
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
import { useFirestore, addDocumentNonBlocking, useFirebaseApp, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const playerSchema = z.object({
  name: z.string().min(3, "Player's name is required."),
  photo: z.any().optional(),
  ageCategory: z.enum(["U13", "U15", "U17", "U19"]),
  teamId: z.string().min(1, 'Please select a team.'),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export function PlayerRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams, isLoading: isLoadingTeams } = useCollection<OFATeam>(teamsQuery);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      ageCategory: "U15",
    }
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('photo', file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: PlayerFormData) => {
    if (!firestore || !user || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Error', description: 'Application is not ready. Please try again.' });
      return;
    }
    
    let photoUrl = '';
    if (data.photo) {
      try {
        const path = `ofa-player-photos/${user.uid}/${Date.now()}_${data.photo.name}`;
        photoUrl = await uploadFile(firebaseApp, data.photo, path);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Photo Upload Failed', description: 'Could not upload player photo.' });
        return;
      }
    }
    
    const selectedTeam = teams?.find(t => t.id === data.teamId);
    if (!selectedTeam) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected team not found.' });
        return;
    }
    const teamName = selectedTeam.teamName;

    const { photo, ...restOfData } = data;

    const logData = {
      ...restOfData,
      teamName,
      photoUrl,
      createdAt: serverTimestamp(),
      speed: 5,
      ballControl: 5,
      passing: 5,
      gameAwareness: 5,
      teamwork: 5,
      attitude: 5,
      attendance: 'Good',
      performanceTrend: 'Stable',
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-players'), logData);
      toast({
        title: 'Player Registered!',
        description: `${data.name} has been added to the league.`,
      });
      reset();
      setPhotoPreview(null);
      router.push('/data/ofa/players');
    } catch (error: any) {
      console.error("Error during form submission:", error)
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
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
            <UserPlus className="h-6 w-6" />
            OFA Player Registration
          </CardTitle>
          <CardDescription>
            Create a player profile for database and talent tracking.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-dashed" data-ai-hint="person avatar">
                <AvatarImage src={photoPreview || ''} />
                <AvatarFallback className="bg-muted">
                  <UserPlus className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Player's Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="teamId">Team</Label>
                {isLoadingTeams ? <Skeleton className="h-10 w-full" /> : (
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
                  <Label htmlFor="ageCategory">Age Category</Label>
                  <Controller name="ageCategory" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="ageCategory"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="U13">U-13</SelectItem>
                              <SelectItem value="U15">U-15</SelectItem>
                              <SelectItem value="U17">U-17</SelectItem>
                              <SelectItem value="U19">U-19</SelectItem>
                          </SelectContent>
                      </Select>
                  )} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input id="school" {...register('school')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input id="class" {...register('class')} placeholder="e.g., P.7, S.3" />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianContact">Guardian's Contact</Label>
              <Input id="guardianContact" {...register('guardianContact')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="careerDream">Career Dream (besides football)</Label>
                <Input id="careerDream" {...register('careerDream')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="skillGoal">A skill they want to improve</Label>
                <Input id="skillGoal" {...register('skillGoal')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="schoolGoal">A goal for school</Label>
                <Input id="schoolGoal" {...register('schoolGoal')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="behaviourGoal">A behaviour goal (e.g. being on time)</Label>
                <Input id="behaviourGoal" {...register('behaviourGoal')} />
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
