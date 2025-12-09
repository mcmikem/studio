
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
import { useFirestore, addDocumentNonBlocking, useFirebaseApp, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const playerSchema = z.object({
  name: z.string().min(3, 'Player name is required.'),
  age: z.coerce.number().min(5, "Age must be 5 or greater."),
  photo: z.any().optional(),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  school: z.string().min(3, "School name is required."),
  class: z.string().optional(),
  attendance: z.enum(['Good', 'Irregular', 'Dropped']),
  performance: z.enum(['Excellent', 'Fair', 'Poor']),
  medicalConditions: z.string().optional(),
  guardianName: z.string().min(3, 'Guardian name is required.'),
  guardianContact: z.string().min(10, 'A valid contact is required.'),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  goalsForTheSeason: z.string().optional(),
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
        position: 'MID',
        attendance: 'Good',
        performance: 'Fair',
    }
  });
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setValue('photo', file);
          setPhotoPreview(URL.createObjectURL(file));
      }
  }

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

    const { photo, ...restOfData } = data;

    const logData = { 
        ...restOfData,
        photoUrl: photoUrl,
        createdAt: serverTimestamp() 
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-players'), logData);
      toast({
        title: 'Player Registered!',
        description: `${data.name} has been added to the league.`,
      });
      reset();
      setPhotoPreview(null);
      router.push('/meal/ofa');
    } catch (error: any) {
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
                <Avatar className="h-24 w-24 border-2 border-dashed">
                    <AvatarImage src={photoPreview || ''} />
                    <AvatarFallback className="bg-muted"><UserPlus className="h-10 w-10 text-muted-foreground"/></AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Photo
                </Button>
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange}/>
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="position">Playing Position</Label>
                    <Controller name="position" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="position"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GK">Goalkeeper (GK)</SelectItem>
                                <SelectItem value="DEF">Defender (DEF)</SelectItem>
                                <SelectItem value="MID">Midfielder (MID)</SelectItem>
                                <SelectItem value="FWD">Forward (FWD)</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Input id="school" {...register('school')} />
                    {errors.school && <p className="text-sm text-destructive">{errors.school.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input id="class" {...register('class')} placeholder="e.g., P.7, S.3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>School Attendance</Label>
                    <Controller name="attendance" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Good">Good</SelectItem>
                                <SelectItem value="Irregular">Irregular</SelectItem>
                                <SelectItem value="Dropped">Dropped Out</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                 <div className="space-y-2">
                    <Label>Academic Performance</Label>
                    <Controller name="performance" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Excellent">Excellent</SelectItem>
                                <SelectItem value="Fair">Fair</SelectItem>
                                <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions (if any)</Label>
                <Textarea id="medicalConditions" {...register('medicalConditions')} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input id="guardianName" {...register('guardianName')} />
                    {errors.guardianName && <p className="text-sm text-destructive">{errors.guardianName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input id="guardianContact" {...register('guardianContact')} />
                    {errors.guardianContact && <p className="text-sm text-destructive">{errors.guardianContact.message}</p>}
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
                <Label htmlFor="goalsForTheSeason">Goals for the Season</Label>
                <Textarea id="goalsForTheSeason" {...register('goalsForTheSeason')} placeholder="e.g., Become top scorer, get a school bursary" />
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

    