
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, Edit, Heart, BookOpen, Shield, Phone, Smile, Frown, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const playerEditSchema = z.object({
  name: z.string().min(3, "Player's name is required.").optional(),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
  playingPosition: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward"]).optional(),
  schoolAttendance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
  academicPerformance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
});

type PlayerEditFormData = z.infer<typeof playerEditSchema>;

function EditPlayerDialog({ player, onOpenChange, open }: { player: OFAPlayer, onOpenChange: (open: boolean) => void, open: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<PlayerEditFormData>({
    resolver: zodResolver(playerEditSchema),
    defaultValues: {
      name: player.name,
      school: player.school || '',
      class: player.class || '',
      guardianContact: player.guardianContact || '',
      careerDream: player.careerDream || '',
      skillGoal: player.skillGoal || '',
      schoolGoal: player.schoolGoal || '',
      behaviourGoal: player.behaviourGoal || '',
      playingPosition: player.playingPosition || undefined,
      schoolAttendance: player.schoolAttendance || undefined,
      academicPerformance: player.academicPerformance || undefined,
    }
  });

  const onSubmit = async (data: PlayerEditFormData) => {
    if (!firestore) return;
    const playerRef = doc(firestore, 'ofa-players', player.id);
    try {
      await updateDocumentNonBlocking(playerRef, data);
      toast({ title: 'Player Updated', description: `${data.name}'s profile has been updated.` });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update player profile.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Player: {player.name}</DialogTitle>
              <DialogDescription>
                Quickly update the key details for this player.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Player Name</Label><Input {...register('name')} /></div>
                    <div className="space-y-2"><Label>Playing Position</Label>
                        <Controller name="playingPosition" control={control} render={({field}) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Goalkeeper">Goalkeeper</SelectItem><SelectItem value="Defender">Defender</SelectItem><SelectItem value="Midfielder">Midfielder</SelectItem><SelectItem value="Forward">Forward</SelectItem></SelectContent></Select>
                        )} />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>School</Label><Input {...register('school')} /></div>
                     <div className="space-y-2"><Label>Class</Label><Input {...register('class')} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>Guardian Contact</Label><Input {...register('guardianContact')} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>School Attendance</Label>
                         <Controller name="schoolAttendance" control={control} render={({field}) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select>
                        )} />
                     </div>
                     <div className="space-y-2"><Label>Academic Performance</Label>
                          <Controller name="academicPerformance" control={control} render={({field}) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select>
                        )} />
                     </div>
                </div>
                <div className="space-y-2">
                    <Label>Personal Goals</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Input {...register('skillGoal')} placeholder="Skill Goal" />
                        <Input {...register('schoolGoal')} placeholder="School Goal" />
                        <Input {...register('behaviourGoal')} placeholder="Behaviour Goal" />
                        <Input {...register('careerDream')} placeholder="Career Dream" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  )
}

function InfoPill({ label, value, icon: Icon }: { label: string, value: string | number | null | undefined, icon?: React.ElementType }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{label}:</span>
            <span className="text-sm text-muted-foreground">{value}</span>
        </div>
    )
}

function PlayerDetailDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const playerDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'ofa-players', id);
  }, [firestore, id]);

  const { data: player, isLoading } = useDoc<OFAPlayer>(playerDocRef);

  const handleDelete = () => {
    if (!firestore || !id) return;
    deleteDocumentNonBlocking(doc(firestore, 'ofa-players', id))
      .then(() => {
        toast({ title: "Player Deleted", description: `${player?.name} has been removed from the database.` });
        router.push('/data/ofa/players');
      })
      .catch((err) => {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete player. Check permissions." });
        console.error(err);
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Not Found</CardTitle>
          <CardDescription>The requested player could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/data/ofa/players"><ArrowLeft className="mr-2 h-4 w-4" />Back to Players List</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
         <Button asChild variant="outline">
            <Link href="/data/ofa/players"><ArrowLeft className="mr-2 h-4 w-4" />Back to Players List</Link>
          </Button>
           <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {player.name}'s record. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-2" data-ai-hint="person avatar">
                <AvatarImage src={player.photoUrl || ''} alt={player.name} />
                <AvatarFallback className="text-3xl">{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{player.name}</CardTitle>
            <CardDescription>{player.teamName} &bull; <Badge variant="secondary">{player.ageCategory}</Badge></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <InfoPill label="Position" value={player.playingPosition} />
                <InfoPill label="School" value={player.school} />
                <InfoPill label="Class" value={player.class} />
                <InfoPill label="Guardian Contact" value={player.guardianContact} icon={Phone} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles /> Player Development</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-4">
                        <InfoPill label="Strengths" value={player.strengths} icon={Smile} />
                        <InfoPill label="Weaknesses" value={player.weaknesses} icon={Frown} />
                        <InfoPill label="Medical Notes" value={player.medicalConditions} icon={Heart} />
                    </CardContent>
                 </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen /> Personal Goals</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-4">
                        <InfoPill label="Career Dream" value={player.careerDream} />
                        <InfoPill label="Skill Goal" value={player.skillGoal} />
                        <InfoPill label="School Goal" value={player.schoolGoal} />
                        <InfoPill label="Behaviour Goal" value={player.behaviourGoal} />
                    </CardContent>
                 </Card>
            </div>
             <Card>
                <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <InfoPill label="School Attendance" value={player.schoolAttendance} />
                    <InfoPill label="Academic Performance" value={player.academicPerformance} />
                </CardContent>
             </Card>
        </CardContent>
      </Card>
      
      {isEditDialogOpen && player && <EditPlayerDialog player={player} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />}
    </div>
  );
}

export default function PlayerDetailPage() {
    return <PlayerDetailDashboard />;
}

    