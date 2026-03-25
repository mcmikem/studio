
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusCircle,
  Briefcase,
  Search,
  ArrowRight,
  BarChart2,
  Users,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const statusColors: { [key: string]: string } = {
    Active: 'border-green-500 bg-green-500/10 text-green-500',
    Moderate: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
    'At Risk': 'border-orange-500 bg-orange-500/10 text-orange-500',
    Delayed: 'border-red-500 bg-red-500/10 text-red-500',
    Completed: 'border-primary bg-primary/10 text-primary',
};


function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant="outline" className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>
        <CardDescription>
          {project.districts} &bull; Managed by {project.manager}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{project.completion}%</span>
          </div>
          <Progress value={project.completion} />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold">Next Milestone</p>
          <p className="text-sm text-muted-foreground">{project.nextMilestone}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild size="sm" className="w-full">
          <Link href={`/management/projects/${project.id}`}>
            View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ProjectsDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    let filtered = projects;

    if (activeTab !== 'All') {
        if(activeTab === 'Completed') {
            filtered = filtered.filter((p) => p.completion === 100);
        } else {
            filtered = filtered.filter((p) => p.status === activeTab && p.completion < 100);
        }
    }
    
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.districts.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [projects, searchTerm, activeTab]);
  
  const stats = useMemo(() => {
    if (!projects) return { enrolled: 0, attendance: 0, adoption: 0 };
    
    const totalParticipants = projects.reduce((acc, p) => acc + (p.participants || 0), 0);
    const activeProjects = projects.filter(p => p.attendanceRate || p.adoptionRate);
    const totalAttendance = activeProjects.reduce((acc, p) => acc + (p.attendanceRate || 0), 0) / (activeProjects.length || 1);
    const totalAdoption = activeProjects.reduce((acc, p) => acc + (p.adoptionRate || 0), 0) / (activeProjects.length || 1);

    return {
        enrolled: totalParticipants, 
        attendance: Math.round(totalAttendance),
        adoption: Math.round(totalAdoption),
    }
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Projects Directory
          </h1>
          <p className="text-muted-foreground">
            A central dashboard for all organizational projects.
          </p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Live Project Stats</CardTitle>
            <CardDescription>Quick view of key performance indicators across all active projects.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.enrolled}</p>
            <p className="text-xs text-muted-foreground">Beneficiaries Enrolled</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <BarChart2 className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.attendance}%</p>
            <p className="text-xs text-muted-foreground">Avg. Attendance</p>
          </div>
           <div className="p-4 bg-muted rounded-lg text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.adoption}%</p>
            <p className="text-xs text-muted-foreground">Skill Adoption</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, manager, location..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
           <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="All">All Projects</TabsTrigger>
                    <TabsTrigger value="Active">Active</TabsTrigger>
                    <TabsTrigger value="At Risk">At Risk</TabsTrigger>
                    <TabsTrigger value="Delayed">Delayed</TabsTrigger>
                    <TabsTrigger value="Completed">Completed</TabsTrigger>
                </TabsList>
                <div className="mt-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-null" />
                        </div>
                    ) : filteredProjects.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredProjects.map((project) => (
                             <ProjectCard key={project.id} project={project} />
                           ))}
                         </div>
                    ) : (
                        <EmptyState 
                            icon={Briefcase}
                            title="No Projects Found"
                            description={`There are no projects that match your current filter and search criteria.`}
                            className="min-h-[300px]"
                        />
                    )}
                </div>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
