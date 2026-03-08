
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Swords, ArrowLeft, Users, Calendar, ShieldCheck, ClipboardList, Package, MessageCircleQuestion, CheckCircle2, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { OFATeamRegistrationForm } from '@/components/forms/ofa/team-registration-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
type EquipmentItem = {
    item: string;
    qty?: number;
    condition?: string;
    needLevel?: string;
};

type NeedItem = {
    area: string;
    priority?: number;
};

function DetailItem({ label, value }: { label: string, value: string | number | undefined | null }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="font-semibold">{String(value)}</p>
        </div>
    );
}

function TeamDetailDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const teamDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'ofa-teams', id);
  }, [firestore, id]);

  const { data: team, isLoading } = useDoc<OFATeam>(teamDocRef);

  const handleDelete = () => {
    if (!firestore || !id) return;
    deleteDocumentNonBlocking(doc(firestore, 'ofa-teams', id))
      .then(() => {
        toast({ title: "Team Deleted", description: `${(team as any)?.teamName} has been removed from the database.` });
        router.push('/meal/data/ofa/teams');
      })
      .catch((err) => {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete team. Check permissions." });
        console.error(err);
      });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Not Found</CardTitle>
          <CardDescription>The requested team could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/meal/data/ofa/teams"><ArrowLeft className="mr-2 h-4 w-4" />Back to Teams List</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const managementData = [
      { role: 'Head Coach', name: (team as any).headCoachName, phone: (team as any).headCoachPhone, attendance: (team as any).headCoachAttendance, availability: (team as any).headCoachAvailability },
      { role: 'Assistant Coach', name: (team as any).assistantCoachName, phone: (team as any).assistantCoachPhone, attendance: (team as any).assistantCoachAttendance, availability: (team as any).assistantCoachAvailability },
      { role: 'Team Manager', name: (team as any).teamManagerName, phone: (team as any).teamManagerPhone, attendance: (team as any).teamManagerAttendance, availability: (team as any).teamManagerAvailability },
      { role: 'Captain', name: (team as any).captainName, phone: (team as any).captainPhone, attendance: (team as any).captainAttendance },
      { role: 'Vice Captain', name: (team as any).viceCaptainName, phone: (team as any).viceCaptainPhone, attendance: (team as any).viceCaptainAttendance },
  ].filter(m => m.name);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <Button asChild variant="outline">
            <Link href="/meal/data/ofa/teams"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Teams</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{(team as any).teamName}" and all its associated data. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          </div>
      </header>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Team: {(team as any).teamName}</DialogTitle>
                    <DialogDescription>Update the registration details for this team.</DialogDescription>
                </DialogHeader>
                <OFATeamRegistrationForm team={team} onSuccess={() => setIsEditDialogOpen(false)} />
            </DialogContent>
       </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Swords className="h-7 w-7" />
                        {(team as any).teamName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailItem label="Subcounty" value={(team as any).subcounty} />
                    <DetailItem label="Parish" value={(team as any).parish} />
                    <DetailItem label="Village" value={(team as any).village} />
                    <DetailItem label="Year Formed" value={(team as any).yearOfEstablishment} />
                    <DetailItem label="Home Pitch" value={(team as any).homePitchName} />
                    <DetailItem label="Team Colours" value={(team as any).teamColours} />
                    <div className="col-span-full"><DetailItem label="Motto/Values" value={(team as any).motto} /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Management Structure</CardTitle></CardHeader>
                <CardContent>
                     {/* Mobile View */}
                    <div className="space-y-4 sm:hidden">
                        {managementData.length > 0 ? managementData.map(m => (
                            <Card key={m.role} className="p-4">
                                <CardTitle className="text-base">{m.role}</CardTitle>
                                <CardDescription>{m.name}</CardDescription>
                                <div className="text-sm mt-2 space-y-1">
                                    <p><strong>Phone:</strong> {m.phone || 'N/A'}</p>
                                    <p><strong>Attendance:</strong> {m.attendance || 'N/A'}</p>
                                    <p><strong>Availability:</strong> {m.availability || 'N/A'}</p>
                                </div>
                            </Card>
                        )) : <p className="text-center h-24">No management data recorded.</p>}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Attendance</TableHead><TableHead>Availability</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {managementData.length > 0 ? managementData.map(m => (
                                    <TableRow key={m.role}><TableCell>{m.role}</TableCell><TableCell>{m.name}</TableCell><TableCell>{m.phone || '-'}</TableCell><TableCell>{m.attendance || '-'}</TableCell><TableCell>{m.availability || '-'}</TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No management data recorded.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Player Development & Education</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Total Players</p><p className="text-2xl font-bold">{(team as any).totalPlayers || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">U-13</p><p className="text-2xl font-bold">{(team as any).u13 || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">U-15</p><p className="text-2xl font-bold">{(team as any).u15 || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">U-17</p><p className="text-2xl font-bold">{(team as any).u17 || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">U-19</p><p className="text-2xl font-bold">{(team as any).u19 || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">% in School</p><p className="text-2xl font-bold">{(team as any).percentageInSchool || 0}%</p></div>
                    </div>
                    <DetailItem label="Main Academic Challenges" value={(team as any).mainAcademicChallenges?.join(', ')} />
                    <DetailItem label="School Attendance Enforcement" value={(team as any).enforceSchoolAttendance} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Training Culture</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <DetailItem label="Training Days per Week" value={(team as any).trainingDaysPerWeek} />
                        <DetailItem label="Average Attendance" value={(team as any).avgTrainingAttendance} />
                        <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${(team as any).useWarmups ? 'text-green-500' : 'text-muted-foreground'}`}/> <span className="text-sm">Uses warm-ups & drills</span></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${(team as any).trackPlayerProgress ? 'text-green-500' : 'text-muted-foreground'}`}/> <span className="text-sm">Tracks player progress</span></div>
                    </div>
                     <div className="space-y-4">
                        <div><Label className="text-sm text-muted-foreground">Punctuality</Label><Progress value={((team as any).punctualityScore || 0)*20} className="h-2 mt-1" /></div>
                        <div><Label className="text-sm text-muted-foreground">Discipline</Label><Progress value={((team as any).disciplineScore || 0)*20} className="h-2 mt-1" /></div>
                     </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Equipment Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead><TableHead>Quantity</TableHead><TableHead>Condition</TableHead><TableHead>Need Level</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
  {(team as any).equipment?.length ? (team as any).equipment.map((e: EquipmentItem) => (
      <TableRow key={e.item}>
          <TableCell>{e.item}</TableCell>
          <TableCell>{e.qty || 0}</TableCell>
          <TableCell>{e.condition}</TableCell>
          <TableCell>{e.needLevel}</TableCell>
      </TableRow>
  )) : (
      <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
              No equipment data.
          </TableCell>
      </TableRow>
  )}
</TableBody>


                            </Table>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Needs Assessment</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                        {(team as any).needs?.length ? (team as any).needs
    .sort((a: NeedItem, b: NeedItem) => (b.priority || 0) - (a.priority || 0))
    .map((n: NeedItem) => (
        <li key={n.area} className="flex justify-between items-center text-sm">
            <span>{n.area}</span>
            <Badge variant="outline">{n.priority}/5</Badge>
        </li>
    ))
    : (
        <li className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
            No needs assessed.
        </li>
    )
}

                        </ul>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Community Involvement</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem label="Community Support" value={(team as any).communitySupport} />
                    <DetailItem label="Parent Engagement" value={(team as any).parentEngagement} />
                    <DetailItem label="Volunteers" value={(team as any).hasVolunteers ? `Yes (${(team as any).volunteerCount || 'N/A'})` : 'No'} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function TeamDetailPage() {
    return <TeamDetailDashboard />;
}
