
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
import { useFirestore, addDocumentNonBlocking, useFirebaseApp, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { useRef, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const playerSchema = z.object({
  name: z.string().min(3, "Player's name is required."),
  age: z.coerce.number().optional().nullable().transform(val => val || null),
  teamId: z.string().min(1, 'Team is required.'),
  playingPosition: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward"]).optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  schoolAttendance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
  academicPerformance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
  medicalConditions: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  skillGoal: z.string().optional(), // 'Goals for the Season'
  photo: z.any().optional(),
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
        playingPosition: 'Midfielder',
        schoolAttendance: 'Good',
        academicPerformance: 'Fair',
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
    
    const selectedTeam = teams?.find(t => t.id === data.teamId);
    if (!selectedTeam) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected team not found.' });
        return;
    }
    
    // Start with core required data
    const logData: { [key: string]: any } = {
        name: data.name,
        teamId: data.teamId,
        teamName: selectedTeam.teamName,
        createdAt: serverTimestamp(),
    };

    // Handle photo upload
    if (data.photo && data.photo.name) {
      try {
        const path = `ofa-player-photos/${user.uid}/${Date.now()}_${data.photo.name}`;
        logData.photoUrl = await uploadFile(firebaseApp, data.photo, path);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Photo Upload Failed', description: 'Could not upload player photo.' });
        return;
      }
    }

    // Conditionally add optional fields ONLY if they have a value
    const optionalFields: (keyof PlayerFormData)[] = [
      'age', 'playingPosition', 'school', 'class', 'schoolAttendance', 'academicPerformance',
      'medicalConditions', 'guardianName', 'guardianContact', 'strengths', 'weaknesses', 'skillGoal'
    ];
    
    optionalFields.forEach(field => {
        const value = data[field];
        if (value !== undefined && value !== null && value !== '' && !(typeof value === 'number' && isNaN(value))) {
            logData[field] = value;
        }
    });

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
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'An error occurred while saving the data. Please check console for details.' });
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Player's Full Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" {...register('age')} />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="teamId">Team</Label>
                {isLoadingTeams ? <Skeleton className="h-10 w-full" /> : (
                     <Controller
                        name="teamId"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="teamId">
                                <SelectValue placeholder="Select a team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams?.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.teamName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                )}
                {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="playingPosition">Playing Position</Label>
                <Controller name="playingPosition" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="playingPosition"><SelectValue placeholder="Select position..." /></SelectTrigger><SelectContent><SelectItem value="Goalkeeper">Goalkeeper</SelectItem><SelectItem value="Defender">Defender</SelectItem><SelectItem value="Midfielder">Midfielder</SelectItem><SelectItem value="Forward">Forward</SelectItem></SelectContent></Select>
                )} />
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="schoolAttendance">School Attendance</Label>
                     <Controller name="schoolAttendance" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="schoolAttendance"><SelectValue placeholder="Select attendance..." /></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select>
                    )} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="academicPerformance">Academic Performance</Label>
                      <Controller name="academicPerformance" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="academicPerformance"><SelectValue placeholder="Select performance..." /></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select>
                    )} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions (if any)</Label>
                <Input id="medicalConditions" {...register('medicalConditions')} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input id="guardianName" {...register('guardianName')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input id="guardianContact" type="tel" {...register('guardianContact')} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="strengths">Strengths</Label>
                <Textarea id="strengths" {...register('strengths')} placeholder="e.g., Pace, Dribbling, Teamwork" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="weaknesses">Weaknesses</Label>
                <Textarea id="weaknesses" {...register('weaknesses')} placeholder="e.g., Heading, Defensive discipline" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="skillGoal">Goals for the Season</Label>
                <Textarea id="skillGoal" {...register('skillGoal')} placeholder="e.g., Become top scorer, get a school bursary" />
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
