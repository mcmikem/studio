
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, Edit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { PlayerRegistrationForm } from '@/components/forms/ofa/player-registration-form';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const playerEditSchema = z.object({
  name: z.string().min(3, "Player's name is required."),
  ageCategory: z.enum(["U13", "U15", "U17", "U19"]),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
});

type PlayerEditFormData = z.infer<typeof playerEditSchema>;

function EditPlayerForm({ player, onFinished }: { player: OFAPlayer, onFinished: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlayerEditFormData>({
        resolver: zodResolver(playerEditSchema),
        defaultValues: {
            name: player.name,
            ageCategory: player.ageCategory,
            school: player.school,
            class: player.class,
            guardianContact: player.guardianContact,
            careerDream: player.careerDream,
            skillGoal: player.skillGoal,
            schoolGoal: player.schoolGoal,
            behaviourGoal: player.behaviourGoal,
        }
    });

    const onSubmit = async (data: PlayerEditFormData) => {
        if (!firestore) return;
        const playerRef = doc(firestore, 'ofa-players', player.id);
        try {
            await updateDocumentNonBlocking(playerRef, data);
            toast({ title: "Player Updated", description: `${player.name}'s details have been saved.`});
            onFinished();
        } catch (error) {
            console.error("Failed to update player:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not save changes."});
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Player's Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            {/* Add other editable fields here as needed */}
             <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input id="school" {...register('school')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input id="class" {...register('class')} />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </form>
    );
}


function PlayerDetailDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const playerDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'ofa-players', id);
  }, [firestore, id]);

  const { data: player, isLoading } = useDoc<OFAPlayer>(playerDocRef);

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
           <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
                <Button><Edit className="mr-2 h-4 w-4" /> Edit Player</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {player.name}</DialogTitle>
                </DialogHeader>
                <EditPlayerForm player={player} onFinished={() => setIsEditDialogOpen(false)} />
            </DialogContent>
           </Dialog>
      </header>

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-2" data-ai-hint="person avatar">
                <AvatarImage src={player.photoUrl} alt={player.name} />
                <AvatarFallback className="text-3xl">{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{player.name}</CardTitle>
            <CardDescription>{player.teamName} &bull; <Badge variant="secondary">{player.ageCategory}</Badge></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p><strong>School:</strong> {player.school || 'N/A'}</p>
                        <p><strong>Class:</strong> {player.class || 'N/A'}</p>
                        <p><strong>Guardian Contact:</strong> {player.guardianContact || 'N/A'}</p>
                    </CardContent>
                 </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Development Goals</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p><strong>Career Dream:</strong> {player.careerDream || 'N/A'}</p>
                        <p><strong>Skill Goal:</strong> {player.skillGoal || 'N/A'}</p>
                        <p><strong>School Goal:</strong> {player.schoolGoal || 'N/A'}</p>
                        <p><strong>Behaviour Goal:</strong> {player.behaviourGoal || 'N/A'}</p>
                    </CardContent>
                 </Card>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlayerDetailPage() {
    return <PlayerDetailDashboard />;
}
