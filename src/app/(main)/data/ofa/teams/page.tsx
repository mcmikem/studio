
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { OFATeamRegistrationForm } from '@/components/forms/ofa/team-registration-form';

export default function TeamsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingTeam, setEditingTeam] = useState<OFATeam | null>(null);

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: teams, isLoading } = useCollection<OFATeam>(teamsQuery);
  
  const handleDelete = (team: OFATeam) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'ofa-teams', team.id))
      .then(() => {
        toast({ title: "Team Deleted", description: `${team.teamName} has been removed.` });
      })
      .catch((err) => {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete team." });
        console.error(err);
      });
  };

  return (
    <>
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Swords className="h-8 w-8" />
          Registered OFA Teams
        </h1>
        <p className="text-muted-foreground">
          A directory of all teams participating in the Omuto Football Alliance.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          {/* Mobile View */}
          <div className="space-y-4 sm:hidden">
             {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
             ))}
             {teams && teams.length > 0 ? (
                teams.map((team) => (
                    <Card key={team.id}>
                        <CardHeader>
                            <CardTitle>{team.teamName}</CardTitle>
                            <CardDescription>{team.subcounty}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p><strong>Coach:</strong> {team.headCoachName}</p>
                            <p><strong>Players:</strong> {team.totalPlayers}</p>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button asChild variant="secondary" className="w-full">
                                <Link href={`/data/ofa/teams/${team.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setEditingTeam(team)}><Edit className="h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                ))
             ) : (
                !isLoading && (
                    <EmptyState
                        icon={Swords}
                        title="No Teams Registered"
                        description="Register the first team using the form in the MEAL Hub."
                    />
                )
             )}
          </div>
          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead className="hidden sm:table-cell">Players</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                       <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                  ))}
                {teams && teams.length > 0 ? (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="hidden md:table-cell">{team.subcounty}</TableCell>
                      <TableCell>{team.headCoachName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{team.totalPlayers}</TableCell>
                       <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/data/ofa/teams/${team.id}`}>View</Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingTeam(team)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{team.teamName}" and all its data. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(team)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48">
                        <EmptyState
                          icon={Swords}
                          title="No Teams Registered"
                          description="Register the first team using the form in the MEAL Hub."
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Edit Team: {editingTeam?.teamName}</DialogTitle>
                <DialogDescription>Update the registration details for this team.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto p-1">
                 {editingTeam && <OFATeamRegistrationForm team={editingTeam} onSuccess={() => setEditingTeam(null)} />}
            </div>
        </DialogContent>
       </Dialog>
    </>
  );
}
