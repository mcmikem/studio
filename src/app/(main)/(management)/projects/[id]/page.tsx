
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore'; 
import type { Project, Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Percent, TrendingUp, Handshake, Download, Link as LinkIcon, Pencil, PlusCircle, Upload, MoreHorizontal, XCircle, BookOpen, File, Video, Banknote, BookUser, Store, CheckSquare, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateSafe, getInitials } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

const initialParticipants = [
    { id: '1', name: 'Aisha Nakato', phone: '077****123', village: 'Kitebi', businessStage: 'Ideation', attendance: 95, businessScore: 78, avatar: 'https://i.imgur.com/5Ke5QZ0.jpeg' },
    { id: '2', name: 'Brian Okello', phone: '078****456', village: 'Buwama Town', businessStage: 'Operating', attendance: 88, businessScore: 92, avatar: 'https://i.imgur.com/7D7Q42G.jpeg' },
    { id: '3', name: 'Cathy Nabulya', phone: '075****789', village: 'Nsangi', businessStage: 'Growth', attendance: 98, businessScore: 95, avatar: 'https://i.imgur.com/8a2eO2J.jpeg' },
];

const sampleModules = ["Intro to Finance", "Budgeting 101", "Savings & Investment", "Digital Finance Tools", "Business Planning"];
const sampleTrainers = ["Dianah Nansikombi", "Kasirye Constantine", "Guest Speaker"];


function ProjectDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
  const [participants, setParticipants] = useState(initialParticipants);

  const addParticipant = (newParticipant: any) => {
    setParticipants(prev => [...prev, { ...newParticipant, id: String(prev.length + 1) }]);
  };

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
          <TabsTrigger value="follow-up">Follow-Up</TabsTrigger>
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
                            <Button><Pencil className="mr-2 h-4 w-4" /> Edit Project</Button>
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Project Participants ({participants.length})</CardTitle>
                        <CardDescription>Enroll and manage all beneficiaries for this project.</CardDescription>
                    </div>
                     <Dialog open={isParticipantDialogOpen} onOpenChange={setIsParticipantDialogOpen}>
                        <DialogTrigger asChild>
                             <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Participant</DialogTitle></DialogHeader>
                            {/* In a real app this would be a full form */}
                             <div className="space-y-4 py-4">
                                <p>A simple form placeholder to demonstrate functionality.</p>
                                <Input placeholder="Participant Name" id="new-name" />
                            </div>
                            <DialogFooter>
                                <Button onClick={() => {
                                    addParticipant({ name: (document.getElementById('new-name') as HTMLInputElement).value, businessStage: 'Ideation', attendance: 0, businessScore: 0, avatar: 'https://i.imgur.com/w2k2jCH.jpeg' });
                                    setIsParticipantDialogOpen(false);
                                }}>Save Participant</Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>
                </CardHeader>
                <CardContent>
                    {participants.length > 0 ? (
                         <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Business Stage</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Business Score</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map(participant => (
                                        <TableRow key={participant.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border">
                                                        <AvatarImage src={participant.avatar} alt={participant.name} />
                                                        <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{participant.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{participant.businessStage}</Badge></TableCell>
                                            <TableCell>{participant.attendance}%</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={participant.businessScore} className="h-2" />
                                                    <span className="font-semibold text-sm">{participant.businessScore}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                         <EmptyState
                            icon={Users}
                            title="No Participants Enrolled"
                            description="This project does not have any participants yet. Enroll them to see them here."
                        />
                    )}
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
                        description="Start a training session to begin tracking live attendance."
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sessions">
           <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle>Training Sessions</CardTitle>
                        <CardDescription>Log and view all training sessions delivered for this project.</CardDescription>
                     </div>
                      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Session Record</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Trainer Session Record</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Module</Label>
                                    <Select><SelectTrigger><SelectValue placeholder="Select a module..." /></SelectTrigger><SelectContent>{sampleModules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Trainer</Label>
                                    <Select><SelectTrigger><SelectValue placeholder="Select a trainer..." /></SelectTrigger><SelectContent>{sampleTrainers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Observations</Label>
                                    <Textarea placeholder="Any notes from the session..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setIsSessionDialogOpen(false)}>Save Session</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Trainer</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>Intro to Finance</TableCell><TableCell>Dianah Nansikombi</TableCell><TableCell>Dec 1, 2025</TableCell></TableRow>
                            <TableRow><TableCell>Budgeting 101</TableCell><TableCell>Kasirye Constantine</TableCell><TableCell>Dec 3, 2025</TableCell></TableRow>
                        </TableBody>
                    </Table>
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
         <TabsContent value="follow-up">
             <Card>
                <CardHeader>
                    <CardTitle>Follow-Up Tracking</CardTitle>
                    <CardDescription>Track long-term skill adoption and impact at 6 and 12 months.</CardDescription>
                </CardHeader>
                 <CardContent>
                      <EmptyState
                        icon={BookUser}
                        title="Follow-Up Not Started"
                        description="Long-term tracking will become available after the project's conclusion."
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

    