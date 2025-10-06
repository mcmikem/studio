
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Briefcase, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const statusIcons: { [key: string]: React.ReactNode } = {
    "On Track": <CheckCircle2 className="h-4 w-4 text-green-500" />,
    "At Risk": <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    "Delayed": <Clock className="h-4 w-4 text-red-500" />,
    "Completed": <CheckCircle2 className="h-4 w-4 text-primary" />
};

const statusColors: { [key: string]: string } = {
    "On Track": "border-green-500 bg-green-500/10 text-green-500",
    "At Risk": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Delayed": "border-red-500 bg-red-500/10 text-red-500",
    "Completed": "border-primary bg-primary/10 text-primary",
};

export function ProgramsOverview() {
  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), where('status', '!=', 'Completed'), orderBy('status'), orderBy('deadline'), limit(5));
  }, [firestore]);

  const { data: programs, isLoading } = useCollection<Program>(programsQuery);

  return (
    <Card>
      <CardHeader>
          <CardTitle>Active Programs Overview</CardTitle>
          <CardDescription>
            A real-time health check of our key initiatives.{' '}
            <Link href="/management/programs" className="text-primary hover:underline">Manage All Programs</Link>
          </CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))}
            {programs && programs.length > 0 ? (
              programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.title}</TableCell>
                  <TableCell>{program.lead}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[program.status]}>
                      <div className="flex items-center gap-1">
                        {statusIcons[program.status]}
                        {program.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(program.deadline), 'dd MMM, yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="h-12 w-12" />
                        <span className="text-lg font-semibold">No Active Programs</span>
                        <p className="text-sm">All programs are marked as completed or none have been added.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
