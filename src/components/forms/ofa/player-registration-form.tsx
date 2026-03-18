'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp, useUser, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Upload, Save, Edit } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemoFirebase } from '@/firebase/provider';
import type { OFATeam, OFAPlayer } from '@/lib/types';
import { useDoc, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const playerSchema = z.object({
  name: z.string().min(2, 'Player name is required.'),
  teamId: z.string().min(1, 'Please select a team.'),
  ageCategory: z.enum(['U13', 'U15', 'U17', 'U19']),
  playingPosition: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  medicalConditions: z.string().optional(),
  schoolAttendance: z.enum(['Good', 'Fair', 'Poor', 'Not Applicable']).optional(),
  academicPerformance: z.enum(['Good', 'Fair', 'Poor', 'Not Applicable']).optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export function PlayerRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { user } = useUser();
  const { toast } = useToast();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const playerId = searchParams.get('id');
  const isEdit = !!playerId;

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams, isLoading: isTeamsLoading } = useCollection<OFATeam>(teamsQuery);

  const playerDocRef = useMemoFirebase(() => {
    if (!firestore || !playerId) return null;
    return doc(firestore, 'ofa-players', playerId);
  }, [firestore, playerId]);
  const { data: playerData, isLoading: isPlayerLoading } = useDoc<OFAPlayer>(playerDocRef);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      ageCategory: 'U15',
      playingPosition: 'Midfielder',
      schoolAttendance: 'Not Applicable',
      academicPerformance: 'Not Applicable',
    },
  });

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    teams?.forEach((team) => map.set(team.id, team.teamName));
    return map;
  }, [teams]);

  useEffect(() => {
    if (playerData) {
      reset({
        name: playerData.name,
        teamId: playerData.teamId,
        ageCategory: playerData.ageCategory as any,
        playingPosition: playerData.playingPosition as any,
        school: playerData.school,
        class: (playerData as any).class,
        guardianContact: (playerData as any).guardianContact,
        careerDream: (playerData as any).careerDream,
        skillGoal: (playerData as any).skillGoal,
        schoolGoal: (playerData as any).schoolGoal,
        behaviourGoal: (playerData as any).behaviourGoal,
        strengths: (playerData as any).strengths,
        weaknesses: (playerData as any).weaknesses,
        medicalConditions: (playerData as any).medicalConditions,
        schoolAttendance: (playerData as any).schoolAttendance as any,
        academicPerformance: (playerData as any).academicPerformance as any,
      });
      if (playerData.photoUrl) {
          setPhotoPreview(playerData.photoUrl);
      }
    }
  }, [playerData, reset]);

  useEffect(() => {
    return () => {
      if (photoPreview && !photoPreview.startsWith('http')) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Image too large', description: `This image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please use an image smaller than 5MB.` });
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: PlayerFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const teamName = teamMap.get(data.teamId);
    if (!teamName) {
      toast({ variant: 'destructive', title: 'Invalid team', description: 'Please select a valid OFA team.' });
      return;
    }

    try {
      let photoUrl: string | null = playerData?.photoUrl || null;
      if (photoFile && app) {
        setIsPhotoUploading(true);
        try {
          const ext = photoFile.name.split('.').pop() || 'jpg';
          const safeName = data.name.replace(/\s+/g, '-').toLowerCase();
          photoUrl = await uploadFile(app, photoFile, buildUploadPath.ofaPlayerPhoto(data.teamId, safeName, ext));
        } finally {
          setIsPhotoUploading(false);
        }
      }

      const payload = {
        ...data,
        teamName,
        photoUrl,
        updatedAt: serverTimestamp(),
      };

      if (isEdit && playerId) {
        await updateDocumentNonBlocking(doc(firestore, 'ofa-players', playerId), payload);
        toast({ title: 'Player Updated', description: `${data.name}'s profile has been updated.` });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'ofa-players'), {
          ...payload,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Player Registered', description: `${data.name} has been added to OFA.` });
      }

      reset();
      setPhotoFile(null);
      setPhotoPreview('');
      router.push('/meal/data/ofa/players');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: error.message });
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
            {isEdit ? <Edit className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />} 
            {isEdit ? 'Edit Player Profile' : 'Player Registration'}
          </CardTitle>
          <CardDescription>
            {isEdit ? `Updating profile for ${playerData?.name || 'player'}...` : 'Register a new OFA player profile with school and development data.'}
          </CardDescription>
        </CardHeader>
        {isPlayerLoading ? (
            <CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[180px_1fr]">
              <div className="space-y-3">
                <Label>Player Photo</Label>
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-28 w-28 border-2 border-primary/30">
                    <AvatarImage src={photoPreview} alt="player" />
                    <AvatarFallback className="text-2xl bg-muted">{'P'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPhotoUploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={onFileChange} />
                <p className="text-[10px] text-muted-foreground text-center">Tap to {photoPreview ? 'change' : 'add'} photo</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register('name')} placeholder="e.g., Kato Ibrahim" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  {isTeamsLoading ? <Skeleton className="h-10 w-full" /> : (
                    <Controller
                      name="teamId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                          <SelectContent>
                            {teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.teamName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                  {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Age Category</Label>
                  <Controller
                    name="ageCategory"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['U13', 'U15', 'U17', 'U19'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Playing Position</Label>
                  <Controller
                    name="playingPosition"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2"><Label htmlFor="school">School</Label><Input id="school" {...register('school')} /></div>
                <div className="space-y-2"><Label htmlFor="class">Class</Label><Input id="class" {...register('class')} /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="guardianContact">Guardian Contact</Label><Input id="guardianContact" {...register('guardianContact')} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>School Attendance</Label><Controller name="schoolAttendance" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Good', 'Fair', 'Poor', 'Not Applicable'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
              )} /></div>
              <div className="space-y-2"><Label>Academic Performance</Label><Controller name="academicPerformance" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Good', 'Fair', 'Poor', 'Not Applicable'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
              )} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="careerDream">Career Dream</Label><Textarea id="careerDream" {...register('careerDream')} /></div>
              <div className="space-y-2"><Label htmlFor="skillGoal">Skill Goal</Label><Textarea id="skillGoal" {...register('skillGoal')} /></div>
              <div className="space-y-2"><Label htmlFor="schoolGoal">School Goal</Label><Textarea id="schoolGoal" {...register('schoolGoal')} /></div>
              <div className="space-y-2"><Label htmlFor="behaviourGoal">Behaviour Goal</Label><Textarea id="behaviourGoal" {...register('behaviourGoal')} /></div>
              <div className="space-y-2"><Label htmlFor="strengths">Strengths</Label><Textarea id="strengths" {...register('strengths')} /></div>
              <div className="space-y-2"><Label htmlFor="weaknesses">Weaknesses</Label><Textarea id="weaknesses" {...register('weaknesses')} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="medicalConditions">Medical Notes</Label><Textarea id="medicalConditions" {...register('medicalConditions')} /></div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEdit ? <Save className="mr-2 h-4 w-4" /> : null)}
              {isEdit ? 'Update Player' : 'Save Player'}
            </Button>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
}
