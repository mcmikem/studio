
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function PlayersPage() {
  const firestore = useFirestore();
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-players'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: players, isLoading } = useCollection<OFAPlayer>(playersQuery);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Team</TableHead>
                <TableHead>Age Category</TableHead>
                <TableHead className="hidden sm:table-cell">School</TableHead>
                <TableHead className="hidden md:table-cell">Guardian Contact</TableHead>
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
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}
              {players && players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                          <AvatarImage src={player.photoUrl} alt={player.name} />
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
                    <TableCell className="hidden md:table-cell">{player.guardianContact}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
