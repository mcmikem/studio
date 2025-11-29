
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
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { OFAMatch } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function MatchesPage() {
  const firestore = useFirestore();
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-matches'), orderBy('date', 'desc'), limit(50));
  }, [firestore]);

  const { data: matches, isLoading } = useCollection<OFAMatch>(matchesQuery);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          OFA Match Results
        </h1>
        <p className="text-muted-foreground">
          A log of all submitted match reports from the Omuto Football Alliance.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="hidden md:table-cell">Goal Scorers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))}
              {matches && matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>{formatDateSafe(match.date, 'dateOnly')}</TableCell>
                    <TableCell className="font-medium">{match.homeTeam} vs {match.awayTeam}</TableCell>
                    <TableCell className="text-center font-bold text-lg">{match.homeScore} - {match.awayScore}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{match.goalScorers}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48">
                      <EmptyState
                        icon={FileText}
                        title="No Match Reports"
                        description="Submit the first match report from the OFA Hub."
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
