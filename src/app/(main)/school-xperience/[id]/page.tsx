'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, where } from 'firebase/firestore';
import { use } from 'react';
import Link from 'next/link';
import {
  Building2, MapPin, Users, Star, Calendar, ClipboardCheck,
  GraduationCap, Heart, Flower2, Droplets, ArrowLeft,
  Eye, AlertCircle, FileText, StarHalf, CheckCircle2,
} from 'lucide-react';
import type { SchoolXperience, SchoolVisitXperience, SchoolScorecard, SchoolLeader } from '@/lib/types';
import { format } from 'date-fns';

const PROGRAMME_ICONS: Record<string, React.ElementType> = {
  SLF: GraduationCap,
  RED: Heart,
  GreenSchools: Flower2,
  PureWater: Droplets,
};

const TIER_COLORS: Record<string, string> = {
  Partner: 'bg-blue-100 text-blue-700 border-blue-200',
  Active: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Advanced: 'bg-orange-100 text-orange-700 border-orange-200',
  Flagship: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  Registered: 'bg-gray-100 text-gray-700 border-gray-200',
  Launched: 'bg-blue-100 text-blue-700 border-blue-200',
  Active: 'bg-green-100 text-green-700 border-green-200',
  Completed: 'bg-purple-100 text-purple-700 border-purple-200',
  Inactive: 'bg-red-100 text-red-700 border-red-200',
};

const RATING_COLORS: Record<string, string> = {
  Red: 'bg-red-100 text-red-700 border-red-200',
  Amber: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Green: 'bg-green-100 text-green-700 border-green-200',
};

export default function SchoolProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();

  const schoolDoc = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'sx-schools', id);
  }, [firestore, id]);

  const { data: school, isLoading: schoolLoading } = useDoc<SchoolXperience>(schoolDoc);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-visits'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const scorecardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-scorecards'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const leadersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-leaders'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: visits, isLoading: visitsLoading } = useCollection<SchoolVisitXperience>(visitsQuery);
  const { data: scorecards, isLoading: scorecardsLoading } = useCollection<SchoolScorecard>(scorecardsQuery);
  const { data: leaders, isLoading: leadersLoading } = useCollection<SchoolLeader>(leadersQuery);

  if (schoolLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">School Not Found</h2>
        <p className="text-muted-foreground mt-2">This school may have been removed or the link is invalid.</p>
        <Button asChild className="mt-6 btn-omuto rounded-xl">
          <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
        </Button>
      </div>
    );
  }

  const flaggedVisits = visits?.filter((v) => v.flagForStory) || [];
  const recentVisits = visits?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          icon={Building2}
          title={school.schoolName}
          description={`${school.location}${school.subCounty ? `, ${school.subCounty}` : ''} — ${school.status || 'Registered'}`}
          breadcrumbs={[
            { name: 'Dashboard', href: '/' },
            { name: 'School Xperience', href: '/school-xperience' },
            { name: school.schoolName, href: `/school-xperience/${id}` },
          ]}
        />
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <Button variant="outline" asChild className="h-10 rounded-xl text-xs font-bold">
            <Link href={`/school-xperience/log-visit?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Log Visit
            </Link>
          </Button>
          <Button asChild className="btn-omuto h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-comic-sm">
            <Link href={`/school-xperience/${id}/edit`}>
              <Building2 className="mr-2 h-4 w-4" />
              Edit School
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-lg shadow-comic-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tier</span>
            </div>
            <Badge className={`text-sm font-bold border ${TIER_COLORS[school.tier || 'Partner']}`}>
              {school.tier || 'Partner'}
            </Badge>
            {school.activeProgrammes && school.activeProgrammes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {school.activeProgrammes.map((p: string) => {
                  const Icon = PROGRAMME_ICONS[p] || Star;
                  return (
                    <Badge key={p} variant="outline" className="text-xs font-bold gap-1">
                      <Icon className="h-3 w-3" />
                      {p}
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-lg shadow-comic-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Term & Year</span>
            </div>
            <p className="text-lg font-black">{school.term || 'Term 1'}</p>
            <p className="text-sm text-muted-foreground">{school.academicYear || new Date().getFullYear()}</p>
          </CardContent>
        </Card>

        <Card className="border-lg shadow-comic-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">School Profile</span>
            </div>
            <p className="text-sm font-bold">{school.enrollmentSize ? `${school.enrollmentSize} students` : '—'}</p>
            {school.patronTeacher && <p className="text-xs text-muted-foreground mt-1">{school.patronTeacher}</p>}
          </CardContent>
        </Card>
      </div>

      {flaggedVisits.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 shadow-comic-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">{flaggedVisits.length} Visit{flaggedVisits.length > 1 ? 's' : ''} Flagged for Story</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {flaggedVisits.map((v) => v.date).join(', ')} — flagged for Alex's media team
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList className="h-12 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="visits" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Visits ({visits?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="scorecards" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <Star className="mr-2 h-4 w-4" />
            Scorecards ({scorecards?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="leaders" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <Users className="mr-2 h-4 w-4" />
            Leaders ({leaders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="info" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Monitoring Visits</CardTitle>
                  <CardDescription>Field visit history for {school.schoolName}</CardDescription>
                </div>
                <Button size="sm" asChild className="h-9 rounded-xl text-xs font-bold btn-omuto">
                  <Link href={`/school-xperience/log-visit?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <ClipboardCheck className="mr-1 h-3 w-3" />
                    Log Visit
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {visitsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
              ) : !visits || visits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No visits logged yet</p>
                  <p className="text-sm">Log the first monitoring visit for this school.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border-lg rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-sm">{visit.date}</span>
                            <span className="text-xs text-muted-foreground">by {visit.visitor}</span>
                            {visit.flagForStory && (
                              <Badge variant="outline" className="text-xs font-bold gap-1 text-primary border-primary/30">
                                <Star className="h-3 w-3" />
                                Story Candidate
                              </Badge>
                            )}
                          </div>
                          {visit.programmesCovered && visit.programmesCovered.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {visit.programmesCovered.map((p) => {
                                const Icon = PROGRAMME_ICONS[p] || Star;
                                return (
                                  <Badge key={p} variant="outline" className="text-xs font-bold gap-1">
                                    <Icon className="h-3 w-3" />
                                    {p}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{visit.objectivesMet}</p>
                          {visit.followUpActions && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs font-semibold text-amber-600">Follow-up: {visit.followUpActions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorecards">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Termly Scorecards</CardTitle>
                  <CardDescription>Monthly performance scores for {school.schoolName}</CardDescription>
                </div>
                <Button size="sm" asChild className="h-9 rounded-xl text-xs font-bold btn-omuto">
                  <Link href={`/school-xperience/submit-scorecard?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <StarHalf className="mr-1 h-3 w-3" />
                    Submit Scorecard
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {scorecardsLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              ) : !scorecards || scorecards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <StarHalf className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No scorecards submitted yet</p>
                  <p className="text-sm">Submit the first scorecard for this school.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scorecards.map((sc) => {
                    const overall = [sc.attendanceScore, sc.activitiesCompleted, sc.studentEngagement, sc.teacherSupport]
                      .reduce((a, b) => a + b, 0) / 4;
                    const rating = overall >= 4 ? 'Green' : overall >= 2.5 ? 'Amber' : 'Red';
                    return (
                      <div key={sc.id} className="border-lg rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold">{sc.month} {sc.academicYear}</p>
                            <p className="text-xs text-muted-foreground">{sc.term}</p>
                          </div>
                          <Badge className={`text-xs font-bold border ${RATING_COLORS[rating]}`}>
                            {rating}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Attendance', value: sc.attendanceScore },
                            { label: 'Activities', value: sc.activitiesCompleted },
                            { label: 'Engagement', value: sc.studentEngagement },
                            { label: 'Teacher Support', value: sc.teacherSupport },
                          ].map((item) => (
                            <div key={item.label} className="text-center">
                              <div className="flex justify-center gap-0.5 mb-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <div
                                    key={n}
                                    className={`h-2 w-3 rounded-sm ${n <= item.value ? 'bg-primary' : 'bg-muted'}`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs font-bold text-muted-foreground">{item.label}</p>
                            </div>
                          ))}
                        </div>
                        {sc.notes && <p className="text-xs text-muted-foreground mt-3 italic">{sc.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Student Leaders</CardTitle>
                  <CardDescription>Commissioned leaders at {school.schoolName}</CardDescription>
                </div>
                <Button size="sm" asChild className="h-9 rounded-xl text-xs font-bold btn-omuto">
                  <Link href={`/school-xperience/add-leader?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <Users className="mr-1 h-3 w-3" />
                    Add Leader
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {leadersLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : !leaders || leaders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No leaders registered yet</p>
                  <p className="text-sm">Add student leaders when they are commissioned.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border-lg rounded-2xl p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{leader.name}</p>
                        <p className="text-xs text-muted-foreground">{leader.role}</p>
                        {leader.year && <p className="text-xs text-muted-foreground">Year: {leader.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <CardTitle className="text-lg font-black">School Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoRow label="School Name" value={school.schoolName} />
                <InfoRow label="Status" value={school.status} />
                <InfoRow label="Location" value={school.location} />
                <InfoRow label="Sub-County" value={school.subCounty} />
                <InfoRow label="District" value={school.district} />
                <InfoRow label="Patron Teacher" value={school.patronTeacher} />
                <InfoRow label="Patron Phone" value={school.patronPhone} />
                <InfoRow label="Patron Email" value={school.patronEmail} />
                <InfoRow label="Head Teacher" value={school.headTeacher} />
                <InfoRow label="Enrollment" value={school.enrollmentSize ? String(school.enrollmentSize) : undefined} />
                <InfoRow label="Tier" value={school.tier} />
                <InfoRow label="Academic Year" value={school.academicYear} />
              </div>
              {school.notes && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{school.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}</p>
    </div>
  );
}
