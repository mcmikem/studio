
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const statusColors: { [key: string]: string } = {
  Active: 'border-green-500 bg-green-500/10 text-green-500',
  Moderate: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  'At Risk': 'border-orange-500 bg-orange-500/10 text-orange-500',
  Delayed: 'border-red-500 bg-red-500/10 text-red-500',
};


function ProjectDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();

  const projectDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'projects', id);
  }, [firestore, id]);

  const { data: project, isLoading } = useDoc<Project>(projectDocRef);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested project could not be found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/management/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to Projects</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
         <Button asChild variant="outline" className="mb-4">
            <Link href="/management/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Projects</Link>
          </Button>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
          <Briefcase className="h-8 w-8" />
          {project.name}
        </h1>
        <p className="text-muted-foreground">
          A detailed dashboard for the {project.name} project.
        </p>
      </header>

       <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Project Snapshot</CardTitle>
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Project Manager</p>
            <p className="font-semibold">{project.manager}</p>
          </div>
           <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Target Districts</p>
            <p className="font-semibold">{project.districts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Next Milestone</p>
            <p className="font-semibold">{project.nextMilestone}</p>
          </div>
           <div className="md:col-span-3 space-y-2">
            <p className="text-sm text-muted-foreground">Overall Completion</p>
            <div className="flex items-center gap-4">
              <Progress value={project.completion} className="h-3" />
              <span className="font-bold text-lg">{project.completion}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Financials</CardTitle>
                <CardDescription>Budget vs. Actuals for this project.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-12">Financial tracking for projects is coming soon.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Impact Metrics</CardTitle>
                <CardDescription>Key performance indicators for this project.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-center text-muted-foreground py-12">KPI tracking for projects is coming soon.</p>
            </CardContent>
        </Card>
      </div>
      <Card>
            <CardHeader>
                <CardTitle>Activity Stream</CardTitle>
                <CardDescription>Recent check-ins and reports related to this project.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-12">Project-specific activity stream is coming soon.</p>
            </CardContent>
        </Card>
    </div>
  );
}

export default function ProjectPage() {
    return <ProjectDashboard />;
}
