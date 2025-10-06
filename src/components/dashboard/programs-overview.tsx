
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
          <CardTitle size="xl">Active Programs Overview</CardTitle>
          <CardDescription>
            A real-time health check of our key initiatives.{' '}
            <Link href="/management/programs" className="text-primary hover:underline">Manage All Programs</Link>
          </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-4 pt-4 border-t">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {programs && programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle size="lg" className="pr-4">{program.title}</CardTitle>
                    <Badge variant="outline" className={`${statusColors[program.status]} mt-1 w-fit flex-shrink-0`}>
                      <div className="flex items-center gap-1">
                        {statusIcons[program.status]}
                        {program.status}
                      </div>
                    </Badge>
                  </div>
                  <CardDescription className="pt-1">{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between pt-0">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Objectives:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {program.objectives.slice(0, 2).map((obj, index) => (
                                <li key={index}>{obj}</li>
                            ))}
                             {program.objectives.length > 2 && <li className="text-xs">...and {program.objectives.length - 2} more.</li>}
                        </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                            <p><strong>Lead:</strong> {program.lead}</p>
                            <p><strong>Deadline:</strong> {format(new Date(program.deadline), "dd MMM, yyyy")}</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                  <Briefcase className="h-16 w-16 text-muted-foreground" />
                  <p className="mt-4 text-lg font-semibold">No Active Programs Found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Completed all programs or add a new one to get started.</p>
              </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
