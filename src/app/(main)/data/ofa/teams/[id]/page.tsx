
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Swords, ArrowLeft, Users, Calendar, ShieldCheck, ClipboardList, Package, MessageCircleQuestion, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

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
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();

  const teamDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'ofa-teams', id);
  }, [firestore, id]);

  const { data: team, isLoading } = useDoc<OFATeam>(teamDocRef);
  
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
            <Link href="/data/ofa/teams"><ArrowLeft className="mr-2 h-4 w-4" />Back to Teams List</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const managementData = [
      { role: 'Head Coach', name: team.headCoachName, phone: team.headCoachPhone, attendance: team.headCoachAttendance, availability: team.headCoachAvailability },
      { role: 'Assistant Coach', name: team.assistantCoachName, phone: team.assistantCoachPhone, attendance: team.assistantCoachAttendance, availability: team.assistantCoachAvailability },
      { role: 'Team Manager', name: team.teamManagerName, phone: team.teamManagerPhone, attendance: team.teamManagerAttendance, availability: team.teamManagerAvailability },
      { role: 'Captain', name: team.captainName, phone: team.captainPhone, attendance: team.captainAttendance },
      { role: 'Vice Captain', name: team.viceCaptainName, phone: team.viceCaptainPhone, attendance: team.viceCaptainAttendance },
  ].filter(m => m.name);

  return (
    <div className="space-y-6">
      <header>
         <Button asChild variant="outline" className="mb-4">
            <Link href="/data/ofa/teams"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Teams</Link>
          </Button>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
          <Swords className="h-8 w-8" />
          {team.teamName}
        </h1>
        <p className="text-muted-foreground">
          Detailed profile and assessment for {team.teamName}.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle>Team Identity</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Subcounty" value={team.subcounty} />
                    <DetailItem label="Parish" value={team.parish} />
                    <DetailItem label="Village" value={team.village} />
                    <DetailItem label="Year Formed" value={team.yearOfEstablishment} />
                    <DetailItem label="Home Pitch" value={team.homePitchName} />
                    <DetailItem label="Team Colours" value={team.teamColours} />
                    <div className="col-span-full"><DetailItem label="Motto/Values" value={team.motto} /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Management Structure</CardTitle></CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Attendance</TableHead><TableHead>Availability</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {managementData.map(m => (
                                    <TableRow key={m.role}><TableCell>{m.role}</TableCell><TableCell>{m.name}</TableCell><TableCell>{m.phone || '-'}</TableCell><TableCell>{m.attendance || '-'}</TableCell><TableCell>{m.availability || '-'}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Player Development & Education</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Total Players</p><p className="text-2xl font-bold">{team.totalPlayers || 0}</p></div>
                        <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">% in School</p><p className="text-2xl font-bold">{team.percentageInSchool || 0}%</p></div>
                    </div>
                    <DetailItem label="Main Academic Challenges" value={team.mainAcademicChallenges?.join(', ')} />
                    <DetailItem label="School Attendance Enforcement" value={team.enforceSchoolAttendance} />
                </CardContent>
            </Card>
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
                                {team.equipment?.map(e => (
                                    <TableRow key={e.item}><TableCell>{e.item}</TableCell><TableCell>{e.qty || 0}</TableCell><TableCell>{e.condition}</TableCell><TableCell>{e.needLevel}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Training Culture</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <DetailItem label="Training Days per Week" value={team.trainingDaysPerWeek} />
                    <DetailItem label="Average Attendance" value={team.avgTrainingAttendance} />
                    <div><Label className="text-sm text-muted-foreground">Punctuality</Label><Progress value={(team.punctualityScore || 0)*20} className="h-2 mt-1" /></div>
                    <div><Label className="text-sm text-muted-foreground">Discipline</Label><Progress value={(team.disciplineScore || 0)*20} className="h-2 mt-1" /></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${team.useWarmups ? 'text-green-500' : 'text-muted-foreground'}`}/> <span className="text-sm">Uses warm-ups & drills</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${team.trackPlayerProgress ? 'text-green-500' : 'text-muted-foreground'}`}/> <span className="text-sm">Tracks player progress</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Community Involvement</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <DetailItem label="Community Support" value={team.communitySupport} />
                    <DetailItem label="Parent Engagement" value={team.parentEngagement} />
                    <DetailItem label="Volunteers" value={team.hasVolunteers ? `Yes (${team.volunteerCount || 'N/A'})` : 'No'} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Needs Assessment</CardTitle></CardHeader>
                <CardContent>
                     <ul className="space-y-2">
                        {team.needs?.sort((a,b) => (b.priority || 0) - (a.priority || 0)).map(n => (
                            <li key={n.area} className="flex justify-between items-center text-sm"><span>{n.area}</span><span className="font-bold">{n.priority}/5</span></li>
                        ))}
                     </ul>
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
