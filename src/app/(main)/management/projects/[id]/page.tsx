
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, where, limit, serverTimestamp } from 'firebase/firestore'; 
import type { Project, Partnership, ProjectParticipant, ProjectParticipantFormData } from '@/lib/types';
import { ProjectParticipantFormSchema } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Users, Percent, TrendingUp, Handshake, Download, Link as LinkIcon, Pencil, PlusCircle, MoreHorizontal, CheckSquare, File, BookUser } from 'lucide-react';
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
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


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

function AddParticipantForm({ projectId, onSuccess }: { projectId: string; onSuccess: () => void; }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ProjectParticipantFormData>({
    resolver: zodResolver(ProjectParticipantFormSchema),
    defaultValues: {
      businessStage: 'Ideation',
    }
  });

  const onSubmit = async (data: ProjectParticipantFormData) => {
    if (!firestore) return;

    try {
      await addDocumentNonBlocking(
        collection(firestore, 'projects', projectId, 'participants'),
        { ...data, createdAt: serverTimestamp() }
      );
      toast({ title: "Participant Added", description: `${data.name} has been added to the project.` });
      onSuccess();
    } catch (e) {
      console.error("Failed to add participant:", e);
      toast({ variant: 'destructive', title: 'Error', description: "Could not add participant." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input {...register('phone')} />
      </div>
      <div className="space-y-2">
        <Label>Village</Label>
        <Input {...register('village')} />
      </div>
       <div className="space-y-2">
        <Label>Business Stage</Label>
        <Controller control={control} name="businessStage" render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Ideation">Ideation</SelectItem>
              <SelectItem value="Operating">Operating</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
            </SelectContent>
          </Select>
        )} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Participant
        </Button>
      </DialogFooter>
    </form>
  )
}

function ProjectDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);

  const projectDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'projects', id);
  }, [firestore, id]);
  
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'projects', id, 'participants'), orderBy('createdAt', 'desc'));
  }, [firestore, id]);

  const { data: project, isLoading: isLoadingProject } = useDoc<Project>(projectDocRef);
  const { data: participants, isLoading: isLoadingParticipants } = useCollection<ProjectParticipant>(participantsQuery);
  
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
                        <CardTitle>Project Participants ({participants?.length || 0})</CardTitle>
                        <CardDescription>Enroll and manage all beneficiaries for this project.</CardDescription>
                    </div>
                     <Dialog open={isParticipantDialogOpen} onOpenChange={setIsParticipantDialogOpen}>
                        <DialogTrigger asChild>
                             <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Participant</DialogTitle></DialogHeader>
                            {id && <AddParticipantForm projectId={id} onSuccess={() => setIsParticipantDialogOpen(false)} />}
                        </DialogContent>
                     </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoadingParticipants ? (
                      <Skeleton className="h-60" />
                    ) : (participants && participants.length > 0) ? (
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
                                                        {participant.avatar && <AvatarImage src={participant.avatar} alt={participant.name} />}
                                                        <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{participant.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{participant.businessStage}</Badge></TableCell>
                                            <TableCell>{participant.attendance || 0}%</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={participant.businessScore || 0} className="h-2" />
                                                    <span className="font-semibold text-sm">{participant.businessScore || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem disabled>View Profile</DropdownMenuItem>
                                                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" disabled>Remove</DropdownMenuItem>
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
                      <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Session Record</Button>
                </CardHeader>
                 <CardContent>
                     <EmptyState
                        icon={BookUser}
                        title="No Sessions Logged"
                        description="Training session logging for projects is coming soon."
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
