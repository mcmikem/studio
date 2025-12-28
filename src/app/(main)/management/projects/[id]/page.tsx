'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import type { Project, Expense, Partnership, Beneficiary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ArrowLeft, DollarSign, Users, Percent, TrendingUp, Handshake, Download, Link as LinkIcon, Pencil, PlusCircle, Upload, MoreHorizontal, CheckCircle, XCircle, BarChart, CheckSquare, Clock, File, Video, BookOpen, Banknote, Store, BookUser } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDateSafe, getInitials } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid } from 'recharts';

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies import('recharts').LegendProps;


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

const sampleParticipants = [
    { id: '1', name: 'Aisha Nakato', phone: '077****123', village: 'Kitebi', businessStage: 'Ideation', attendance: 95, businessScore: 78, avatar: 'https://i.imgur.com/5Ke5QZ0.jpeg' },
    { id: '2', name: 'Brian Okello', phone: '078****456', village: 'Buwama Town', businessStage: 'Operating', attendance: 88, businessScore: 92, avatar: 'https://i.imgur.com/7D7Q42G.jpeg' },
    { id: '3', name: 'Cathy Nabulya', phone: '075****789', village: 'Nsangi', businessStage: 'Growth', attendance: 98, businessScore: 95, avatar: 'https://i.imgur.com/8a2eO2J.jpeg' },
    { id: '4', name: 'David Semakula', phone: '070****101', village: 'Maya', businessStage: 'Ideation', attendance: 82, businessScore: 65, avatar: 'https://i.imgur.com/4Jz2h2X.jpeg' },
    { id: '5', name: 'Esther Akongo', phone: '079****212', village: 'Nkozi', businessStage: 'Operating', attendance: 91, businessScore: 85, avatar: 'https://i.imgur.com/3Y2a0yI.jpeg' },
    { id: '6', name: 'Frank Mubiru', phone: '071****313', village: 'Kitebi', businessStage: 'Operating', attendance: 93, businessScore: 88, avatar: 'https://i.imgur.com/O3GqA4m.jpeg' },
    { id: '7', name: 'Grace Nabwire', phone: '072****414', village: 'Buwama Town', businessStage: 'Growth', attendance: 99, businessScore: 97, avatar: 'https://i.imgur.com/C1zAl4P.jpeg' },
    { id: '8', name: 'Henry Ssebugwawo', phone: '073****515', village: 'Nsangi', businessStage: 'Ideation', attendance: 85, businessScore: 70, avatar: 'https://i.imgur.com/w2k2jCH.jpeg' },
    { id: '9', name: 'Irene Kansiime', phone: '074****616', village: 'Maya', businessStage: 'Operating', attendance: 92, businessScore: 89, avatar: 'https://i.imgur.com/nJgqL6p.jpeg' },
    { id: '10', name: 'John Okoth', phone: '076****717', village: 'Nkozi', businessStage: 'Growth', attendance: 96, businessScore: 94, avatar: 'https://i.imgur.com/Q2z2a4U.jpeg' },
];

const sampleModules = ["Intro to Finance", "Budgeting 101", "Savings & Investment", "Digital Finance Tools", "Business Planning"];
const sampleTrainers = ["Dianah Nansikombi", "Kasirye Constantine", "Guest Speaker"];

const sampleResources = [
    { type: 'document', name: 'Financial Literacy Booklet', format: 'PDF', size: '1.2MB', icon: BookOpen },
    { type: 'document', name: 'Personal Budget Worksheet', format: 'XLSX', size: '45KB', icon: File },
    { type: 'media', name: 'Workshop Intro Video', format: 'MP4', size: '25.6MB', icon: Video },
];

const skillsImprovementData = [
  { "skill": "Budgeting", "A": 45, "B": 75 },
  { "skill": "Saving", "A": 50, "B": 85 },
  { "skill": "Investing", "A": 20, "B": 60 },
  { "skill": "Digital Tools", "A": 30, "B": 80 },
  { "skill": "Business Plan", "A": 15, "B": 70 },
]

const progressOverTimeData = [
  { "month": "Jan", "score": 20 },
  { "month": "Feb", "score": 35 },
  { "month": "Mar", "score": 50 },
  { "month": "Apr", "score": 65 },
  { "month": "May", "score": 80 },
]

function ProjectDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

  React.useEffect(() => {
    // Initialize attendance state
    const initialAttendance = sampleParticipants.reduce((acc, p) => {
        acc[p.id] = true; // Default to present
        return acc;
    }, {} as Record<string, boolean>);
    setAttendance(initialAttendance);
  }, []);

  const toggleAttendance = (participantId: string) => {
    setAttendance(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }));
  };

  const presentCount = React.useMemo(() => Object.values(attendance).filter(Boolean).length, [attendance]);
  const presentPercentage = React.useMemo(() => (presentCount / sampleParticipants.length) * 100, [presentCount]);

  const projectDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'projects', id);
  }, [firestore, id]);

  const { data: project, isLoading: isLoadingProject } = useDoc<Project>(projectDocRef);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !project?.name) return null;
    return query(collection(firestore, 'beneficiaries'), where('programEnrolled', '==', project.name));
  }, [firestore, project?.name]);
  
  const { data: beneficiaries } = useCollection<Beneficiary>(beneficiariesQuery);
  
  const partnerQuery = useMemoFirebase(() => {
      if (!firestore || !project) return null;
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
          {project.districts} – {project.participants || 50} Youth Participants
        </p>
      </header>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Participants" value={project.participants || 50} icon={Users} />
            <StatCard title="Attendance Rate" value={`${project.attendanceRate || 88}%`} icon={Percent} />
            <StatCard title="Avg Learning Improvement" value={`${project.learningImprovement || 45}%`} icon={TrendingUp} />
            <StatCard title="6-Month Adoption Rate" value={`${project.adoptionRate || 62}%`} icon={TrendingUp} />
            <StatCard title="Partner" value={project.partner || 'Stanbic Bank'} icon={Handshake} />
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
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Charter</Button>
                            <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4" /> Share Link</Button>
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
                <CardHeader>
                    <CardTitle>Project Participants</CardTitle>
                     <CardDescription>Enroll and manage all beneficiaries for this project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Button>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload CSV</Button>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                                    <TableHead className="hidden sm:table-cell">Village</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {beneficiaries && beneficiaries.length > 0 ? (
                                    beneficiaries.map(participant => (
                                    <TableRow key={participant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border">
                                                    <AvatarImage src={participant.photoURL || undefined} alt={participant.name} />
                                                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{participant.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{participant.phone}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{participant.village}</TableCell>
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
                                ))) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No participants enrolled yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="attendance">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workshop Day Interface</CardTitle>
                            <CardDescription>Click on a participant to toggle their attendance status.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {beneficiaries && beneficiaries.map(participant => (
                                <button key={participant.id} onClick={() => toggleAttendance(participant.id)} className="group space-y-2">
                                    <div className={cn("p-2 border-2 rounded-lg transition-colors", attendance[participant.id] ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10')}>
                                        <Avatar className="h-20 w-20 mx-auto">
                                            <AvatarImage src={participant.photoURL || undefined} />
                                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="text-xs font-medium text-center truncate group-hover:text-primary">{participant.name}</p>
                                </button>
                            ))}
                             {(!beneficiaries || beneficiaries.length === 0) && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No participants to display.</p>}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Live Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="font-medium flex items-center gap-2"><CheckSquare className="text-green-500"/> Present</span>
                                <span className="font-bold text-2xl">{presentPercentage.toFixed(0)}%</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="font-medium flex items-center gap-2"><XCircle className="text-destructive"/> Absent</span>
                                <span className="font-bold text-2xl">{100-presentPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="font-medium">Late Count</span>
                                <span className="font-bold text-2xl">0</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="font-medium">Engagement Score</span>
                                <span className="font-bold text-2xl">N/A</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
                                    <Label>Duration (minutes)</Label>
                                    <Input type="number" placeholder="e.g., 90" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Observations / Challenges</Label>
                                    <Textarea placeholder="Any notes from the session..." />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Next Step</Label>
                                    <Input placeholder="e.g., Follow up on budgeting exercise" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setIsSessionDialogOpen(false)}>Save Session</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <Table>
                        <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Trainer</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {/* Sample data */}
                            <TableRow><TableCell>Intro to Finance</TableCell><TableCell>Dianah Nansikombi</TableCell><TableCell>Dec 1, 2025</TableCell></TableRow>
                            <TableRow><TableCell>Budgeting 101</TableCell><TableCell>Kasirye Constantine</TableCell><TableCell>Dec 3, 2025</TableCell></TableRow>
                        </TableBody>
                    </Table>
                     <div className="pt-4">
                        <CardTitle>Module Effectiveness</CardTitle>
                         <div className="h-48 w-full mt-2">
                            <ResponsiveContainer>
                                <RechartsBarChart data={[{name: 'Intro', score: 85}, {name: 'Budget', score: 72}, {name: 'Saving', score: 91}]}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <RechartsBar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="resources">
             <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Resources & Materials</CardTitle>
                        <CardDescription>Project-related documents, media, and templates.</CardDescription>
                    </div>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload New Resource</Button>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sampleResources.map((res, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <res.icon className="h-6 w-6 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm">{res.name}</p>
                                <p className="text-xs text-muted-foreground">{res.format} - {res.size}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="ml-auto"><Download className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="reports">
             <Card>
                <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>Auto-generated project reports and analytics.</CardDescription>
                     <div className="flex gap-2 pt-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Excel</Button>
                    </div>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-base">Financial Skills Improvement (Pre vs. Post)</h4>
                         <div className="h-64 w-full mt-2">
                             <ResponsiveContainer>
                                 <RadarChart data={skillsImprovementData}>
                                     <PolarGrid />
                                     <PolarAngleAxis dataKey="skill" />
                                     <Tooltip />
                                     <Radar name="Pre-test" dataKey="A" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.6} />
                                     <Radar name="Post-test" dataKey="B" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.7} />
                                 </RadarChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-base">Participant Progress Over Time (Avg. Score)</h4>
                         <div className="h-64 w-full mt-2">
                            <ResponsiveContainer>
                                <LineChart data={progressOverTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="follow-up">
             <Card>
                <CardHeader>
                    <CardTitle>Follow-Up Tracking</CardTitle>
                    <CardDescription>Track long-term skill adoption and impact at 6 and 12 months.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Active Businesses" value="78%" icon={Store} />
                        <StatCard title="Recorded Profits" value="65%" icon={DollarSign} />
                        <StatCard title="Using Bookkeeping" value="85%" icon={BookUser} />
                        <StatCard title="Opened Bank Account" value="55%" icon={Banknote} />
                    </div>
                     <div className="pt-4">
                        <h4 className="font-semibold text-base mb-2">Beneficiary Follow-up List</h4>
                         <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Beneficiary</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Contacted</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {beneficiaries && beneficiaries.length > 0 ? (
                                        beneficiaries.slice(0,5).map(b => (
                                             <TableRow key={b.id}>
                                                 <TableCell>{b.name}</TableCell>
                                                 <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                                                 <TableCell>2 weeks ago</TableCell>
                                                 <TableCell className="text-right"><Button variant="outline" size="sm">Log Follow-up</Button></TableCell>
                                             </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No beneficiaries enrolled in this project yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </div>
                    </div>
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

  