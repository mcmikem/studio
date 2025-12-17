
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, Edit, Heart, BookOpen, Shield, Phone, Smile, Frown, Sparkles } from 'lucide-react';
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
    </div>
  );
}

export default function PlayerDetailPage() {
    return <PlayerDetailDashboard />;
}
