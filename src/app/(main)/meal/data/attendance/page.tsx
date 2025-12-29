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
import type { AttendanceRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AttendanceRecordsPage() {
  const firestore = useFirestore();
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'attendance-records'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: records, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <CheckCircle className="h-8 w-8" />
          Attendance Records
        </h1>
        <p className="text-muted-foreground">
          A complete log of all participant attendance across all events and sessions.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead className="hidden md:table-cell">Participant Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}
              {records && records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.eventName}</TableCell>
                    <TableCell className="hidden md:table-cell">{record.participantName}</TableCell>
                    <TableCell>{record.age}</TableCell>
                    <TableCell>{record.gender}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDateSafe(record.date, 'dateOnly')}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-48"
                    >
                      <EmptyState
                        icon={CheckCircle}
                        title="No Attendance Logged"
                        description="Use the attendance form in the MEAL Hub to start tracking participants."
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
