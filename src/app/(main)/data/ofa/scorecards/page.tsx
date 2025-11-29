
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
import type { OFAScorecard } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ScorecardsPage() {
  const firestore = useFirestore();
  const scorecardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-scorecards'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: scorecards, isLoading } = useCollection<OFAScorecard>(scorecardsQuery);

  const calculateAverage = (scorecard: OFAScorecard) => {
    const scores = [
      scorecard.trainingAttendance,
      scorecard.coachingQuality,
      scorecard.playerDiscipline,
      scorecard.academicAttendance,
      scorecard.parentEngagement,
      scorecard.communityReputation,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          OFA Team Scorecards
        </h1>
        <p className="text-muted-foreground">
          Quarterly performance reviews for all teams in the alliance.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="hidden md:table-cell">Month</TableHead>
                <TableHead>Training</TableHead>
                <TableHead>Coaching</TableHead>
                <TableHead>Discipline</TableHead>
                <TableHead className="hidden sm:table-cell">Academics</TableHead>
                <TableHead className="text-right">Avg. Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {scorecards && scorecards.length > 0 ? (
                scorecards.map((scorecard) => (
                  <TableRow key={scorecard.id}>
                    <TableCell className="font-medium">{scorecard.teamName}</TableCell>
                    <TableCell className="hidden md:table-cell">{scorecard.month}</TableCell>
                    <TableCell>{scorecard.trainingAttendance}/5</TableCell>
                    <TableCell>{scorecard.coachingQuality}/5</TableCell>
                    <TableCell>{scorecard.playerDiscipline}/5</TableCell>
                    <TableCell className="hidden sm:table-cell">{scorecard.academicAttendance}/5</TableCell>
                    <TableCell className="text-right font-bold">{calculateAverage(scorecard).toFixed(1)}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48">
                      <EmptyState
                        icon={BarChart}
                        title="No Scorecards Submitted"
                        description="Submit the first quarterly scorecard from the OFA Hub."
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
