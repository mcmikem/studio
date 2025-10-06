'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Briefcase, User, Calendar } from 'lucide-react';
import Link from 'next/link';

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
            <Link href="/management/programs" className="text-primary hover:underline">Manage Programs</Link>
          </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="space-y-4 sm:hidden">
            {isLoading && Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            {programs && programs.length > 0 ? (
                programs.map(program => (
                    <Card key={program.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{program.title}</CardTitle>
                                <Badge variant="outline" className={statusColors[program.status]}>{program.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <div className="flex items-center text-muted-foreground">
                                <User className="h-4 w-4 mr-2" />
                                <span>Lead: {program.lead}</span>
                            </div>
                             <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Deadline: {program.deadline}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                !isLoading && (
                    <div className="h-32 text-center text-muted-foreground flex flex-col items-center justify-center">
                        <Briefcase className="h-8 w-8" />
                        <span className="mt-2">No active programs found.</span>
                    </div>
                )
            )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
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
              {isLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              )}
              {programs && programs.length > 0 ? (
                  programs.map((program) => (
                      <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.title}</TableCell>
                          <TableCell>{program.lead}</TableCell>
                          <TableCell>
                              <Badge variant="outline" className={statusColors[program.status]}>
                                  {program.status}
                              </Badge>
                          </TableCell>
                          <TableCell>{program.deadline}</TableCell>
                      </TableRow>
                  ))
              ) : (
                !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="h-8 w-8" />
                          <span>No active programs found.</span>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
