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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trash2, Edit, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PlayersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-players'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: players, isLoading } = useCollection<OFAPlayer>(playersQuery);

  const handleDelete = (player: OFAPlayer) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'ofa-players', player.id))
      .then(() => {
        toast({ title: "Player Deleted", description: `${player.name} has been removed from the database.` });
      })
      .catch((err) => {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete player. Check permissions." });
        console.error(err);
      });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          OFA Player Database
        </h1>
        <p className="text-muted-foreground">
          A central directory of all registered OFA players.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
           {/* Mobile View */}
           <div className="sm:hidden space-y-4">
             {isLoading && Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
             {players && players.length > 0 ? (
                players.map(player => (
                    <Card key={player.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={player.photoUrl || ''} alt={player.name} />
                                <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{player.name}</CardTitle>
                                <CardDescription>{player.teamName} <Badge variant="outline" className="ml-2">{player.ageCategory}</Badge></CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">School: {player.school || 'N/A'}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="secondary" className="w-full">
                                <Link href={`/meal/data/ofa/players/${player.id}`}>View Profile <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))
             ) : (
                !isLoading && <EmptyState icon={Users} title="No Players Found" description="Register a player to see them here." />
             )}
           </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead>Age Category</TableHead>
                  <TableHead className="hidden sm:table-cell">School</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                {players && players.length > 0 ? (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                            <AvatarImage src={player.photoUrl || ''} alt={player.name} />
                            <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{player.teamName}</TableCell>
                      <TableCell><Badge variant="outline">{player.ageCategory}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell">{player.school}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                           <Button asChild variant="ghost" size="icon">
                              <Link href={`/meal/data/ofa/players/${player.id}`}><ArrowRight className="h-4 w-4" /></Link>
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
                                <AlertDialogDescription>
                                  This will permanently delete {player.name}'s record. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(player)}>Delete</AlertDialogAction>
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
                      <TableCell colSpan={5} className="h-48">
                        <EmptyState
                          icon={Users}
                          title="No Players Registered"
                          description="Register your first player using the form in the OFA Hub."
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
  );
}
