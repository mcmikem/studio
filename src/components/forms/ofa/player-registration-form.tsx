
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
import { OFAPlayerSchema } from '@/lib/types';
import Image from 'next/image';

type PlayerFormData = z.infer<typeof OFAPlayerSchema>;

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
    resolver: zodResolver(OFAPlayerSchema),
    defaultValues: {
        ageCategory: 'U17',
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

    try {
      let photoUrl: string | null = null;
      if (data.photo && data.photo instanceof File) {
          const path = `ofa-player-photos/${user.uid}/${Date.now()}_${data.photo.name}`;
          photoUrl = await uploadFile(firebaseApp, data.photo, path);
      }

      const logData: Partial<OFAPlayer> = {};
      
      (Object.keys(data) as Array<keyof PlayerFormData>).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== '' && value !== null && !['photo'].includes(key)) {
           if (key === 'age' && value === 0) {
            // Skip age if it's 0 but don't add it as null unless it's truly meant to be cleared.
           } else {
             logData[key as keyof OFAPlayer] = value as any;
           }
        }
      });

      logData.teamName = selectedTeam.teamName;
      logData.createdAt = serverTimestamp();
      
      if (photoUrl) logData.photoUrl = photoUrl;

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
                <Image src="https://i.imgur.com/gC5fG7T.png" alt="OFA Logo" width={100} height={100} data-ai-hint="logo" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Photo
                </Button>
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                {photoPreview && <Avatar className="h-24 w-24"><AvatarImage src={photoPreview} /></Avatar>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Player's Fullname</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" {...register('age')} />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                </div>
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
                    <Label htmlFor="ageCategory">Age Category</Label>
                    <Controller name="ageCategory" control={control} render={({field}) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="U13">U13</SelectItem>
                                <SelectItem value="U15">U15</SelectItem>
                                <SelectItem value="U17">U17</SelectItem>
                                <SelectItem value="U19">U19</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="playingPosition">Playing Position</Label>
                 <Controller name="playingPosition" control={control} render={({field}) => (
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger><SelectValue placeholder="Select a position..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                            <SelectItem value="Defender">Defender</SelectItem>
                            <SelectItem value="Midfielder">Midfielder</SelectItem>
                            <SelectItem value="Forward">Forward</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
            </div>

            <div className="my-6 border-t-2 border-dashed" />
            <h3 className="text-md font-semibold text-muted-foreground">Detailed Profile (Optional)</h3>

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
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>School Attendance</Label>
                    <Controller name="schoolAttendance" control={control} render={({field}) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger><SelectValue placeholder="Select attendance..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Good">Good</SelectItem>
                                <SelectItem value="Fair">Fair</SelectItem>
                                <SelectItem value="Poor">Poor</SelectItem>
                                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                 <div className="space-y-2">
                    <Label>Academic Performance</Label>
                    <Controller name="academicPerformance" control={control} render={({field}) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger><SelectValue placeholder="Select performance..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Good">Good</SelectItem>
                                <SelectItem value="Fair">Fair</SelectItem>
                                <SelectItem value="Poor">Poor</SelectItem>
                                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian's Name</Label>
                    <Input id="guardianName" {...register('guardianName')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian's Contact</Label>
                    <Input id="guardianContact" {...register('guardianContact')} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea id="medicalConditions" {...register('medicalConditions')} />
            </div>

             <div className="space-y-2">
                <Label htmlFor="strengths">Player Strengths</Label>
                <Textarea id="strengths" {...register('strengths')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="weaknesses">Player Weaknesses</Label>
                <Textarea id="weaknesses" {...register('weaknesses')} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="careerDream">Career Dream</Label>
                    <Input id="careerDream" {...register('careerDream')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="skillGoal">Personal Skill Goal</Label>
                    <Input id="skillGoal" {...register('skillGoal')} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="schoolGoal">School Goal</Label>
                    <Input id="schoolGoal" {...register('schoolGoal')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="behaviourGoal">Behaviour Goal</Label>
                    <Input id="behaviourGoal" {...register('behaviourGoal')} />
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
