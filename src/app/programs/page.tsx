'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock, Briefcase } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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


export default function ProgramsPage() {
  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);
  const { data: programs, isLoading } = useCollection<Program>(programsQuery);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Program Tracker
        </h1>
        <p className="text-muted-foreground">
          A high-level overview of all Omuto Foundation programs and their current status.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <div className="mt-4 pt-4 border-t">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {programs && programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                  <Badge variant="outline" className={statusColors[program.status]}>
                    <div className="flex items-center gap-1">
                      {statusIcons[program.status]}
                      {program.status}
                    </div>
                  </Badge>
                </div>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                  <div>
                      <h4 className="font-semibold text-sm mb-2">Key Objectives:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {program.objectives.map((obj, index) => (
                              <li key={index}>{obj}</li>
                          ))}
                      </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                          <p><strong>Lead:</strong> {program.lead}</p>
                          <p><strong>Deadline:</strong> {program.deadline}</p>
                      </div>
                  </div>
              </CardContent>
            </Card>
          ))
        ) : (
            !isLoading && (
                 <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                            <Briefcase className="h-16 w-16 text-muted-foreground" />
                            <p className="mt-4 text-lg font-semibold">No Programs Found</p>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by adding the first program to your database.</p>
                        </div>
                    </CardContent>
                </Card>
            )
        )}
      </div>
    </div>
  );
}
