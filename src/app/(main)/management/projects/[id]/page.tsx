
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore'; 
import type { Project, Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Percent, TrendingUp, Handshake, Download, Link as LinkIcon, Pencil, CheckSquare, File } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateSafe } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';


const statusColors: { [key: string]: string } = {
  Active: 'border-green-500 bg-green-500/10 text-green-500',
  Moderate: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  'At Risk': 'border-orange-500 bg-orange-500/10 text-orange-500',
  Delayed: 'border-red-500 bg-red-500/10 text-red-500',
  Completed: 'border-primary bg-primary/10 text-primary',
};


function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
    return (
        <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

function ProjectDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();

  const projectDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'projects', id);
  }, [firestore, id]);

  const { data: project, isLoading: isLoadingProject } = useDoc<Project>(projectDocRef);
  
  const partnerQuery = useMemoFirebase(() => {
      if (!firestore || !project || !project.partner) return null;
      return query(collection(firestore, 'partnerships'), where('name', '==', project.partner), limit(1));
  }, [firestore, project]);

  const { data: partnerData } = useCollection<Partnership>(partnerQuery);
  const partner = partnerData?.[0];

  const isLoading = isLoadingProject;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
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
          {project.name}
        </h1>
        <p className="text-muted-foreground">
          {project.districts} – {project.participants || 0} Youth Participants
        </p>
      </header>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Participants" value={project.participants || 0} icon={Users} />
            <StatCard title="Attendance Rate" value={`${project.attendanceRate || 0}%`} icon={Percent} />
            <StatCard title="Learning Improvement" value={`${project.learningImprovement || 0}%`} icon={TrendingUp} />
            <StatCard title="Skill Adoption" value={`${project.adoptionRate || 0}%`} icon={TrendingUp} />
            <StatCard title="Partner" value={project.partner || 'N/A'} icon={Handshake} />
        </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="sessions">Training Sessions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                    <CardDescription>High-level information and status of the project.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                         <div className="space-y-1">
                            <h4 className="font-semibold">Project Info</h4>
                            <p className="text-sm">ID: {project.id}</p>
                            <p className="text-sm">Status: <Badge variant="outline" className={statusColors[project.status]}>{project.status}</Badge></p>
                            <p className="text-sm">Timeline: {formatDateSafe(project.startDate, 'dateOnly')} - {formatDateSafe(project.endDate, 'dateOnly')}</p>
                            <p className="text-sm">Owner: {project.manager}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Download Charter</Button>
                            <Button variant="outline" disabled><LinkIcon className="mr-2 h-4 w-4" /> Share Link</Button>
                            <Button disabled><Pencil className="mr-2 h-4 w-4" /> Edit Project</Button>
                        </div>
                    </div>
                     <div className="md:col-span-1">
                        {partner && (
                             <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-base">{partner.name}</CardTitle>
                                    <CardDescription>{partner.type}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <p>{partner.contactPerson}</p>
                                    <p className="text-muted-foreground">{partner.contactEmail}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="participants">
            <Card>
                <CardHeader>
                    <CardTitle>Project Participants</CardTitle>
                    <CardDescription>Enroll and manage all beneficiaries for this project.</CardDescription>
                </CardHeader>
                <CardContent>
                     <EmptyState
                        icon={Users}
                        title="Participant Management Coming Soon"
                        description="Detailed participant tracking for each project is under development."
                    />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="attendance">
            <Card>
                <CardHeader>
                    <CardTitle>Workshop Day Interface</CardTitle>
                    <CardDescription>Live attendance tracking for training sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={CheckSquare}
                        title="No Active Session"
                        description="Start a training session to begin tracking live attendance. This feature is under development."
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sessions">
           <Card>
                <CardHeader>
                    <CardTitle>Training Sessions</CardTitle>
                    <CardDescription>Log and view all training sessions delivered for this project.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <EmptyState
                        icon={Users}
                        title="Session Logging Coming Soon"
                        description="A dedicated module for logging training sessions and materials is under development."
                    />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="resources">
             <Card>
                <CardHeader>
                    <CardTitle>Resources & Materials</CardTitle>
                    <CardDescription>Project-related documents, media, and templates.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <EmptyState
                        icon={File}
                        title="No Resources"
                        description="Upload project charters, templates, or media files here."
                    />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="reports">
             <Card>
                <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>Auto-generated project reports and analytics.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <EmptyState
                        icon={TrendingUp}
                        title="Data Pending"
                        description="Reports and visualizations will be generated as project data is collected."
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProjectPage() {
    return <ProjectDashboard />;
}
