
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export default function TeamsPage() {
  const firestore = useFirestore();
  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: teams, isLoading } = useCollection<OFATeam>(teamsQuery);

  return (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead className="hidden sm:table-cell">Players</TableHead>
                <TableHead className="hidden sm:table-cell">Age Groups</TableHead>
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
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell className="hidden md:table-cell">{team.subcounty}</TableCell>
                    <TableCell>{team.coachName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{team.numberOfPlayers}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                            {team.ageGroups.map(ag => <Badge key={ag} variant="secondary">{ag}</Badge>)}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48">
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
        </CardContent>
      </Card>
    </div>
  );
}
