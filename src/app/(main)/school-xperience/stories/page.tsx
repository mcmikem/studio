'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Star,
  Calendar,
  MapPin,
  GraduationCap,
  Heart,
  Flower2,
  Droplets,
  Video,
  Filter,
  CheckCircle2,
  Eye,
  ClipboardCheck,
} from 'lucide-react';
import type { SchoolVisitXperience, SchoolXperience } from '@/lib/types';
import { format } from 'date-fns';

const PROGRAMME_ICONS: Record<string, React.ElementType> = {
  SLF: GraduationCap,
  RED: Heart,
  GreenSchools: Flower2,
  PureWater: Droplets,
};

const PROGRAMME_COLORS: Record<string, string> = {
  SLF: 'bg-blue-100 text-blue-700 border-blue-200',
  RED: 'bg-pink-100 text-pink-700 border-pink-200',
  GreenSchools: 'bg-green-100 text-green-700 border-green-200',
  PureWater: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

export default function StoryHubPage() {
  const firestore = useFirestore();
  const [filterProgramme, setFilterProgramme] = useState<string>('All');
  const [search, setSearch] = useState('');

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-visits'),
      where('flagForStory', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: flaggedVisits, isLoading } = useCollection<SchoolVisitXperience>(visitsQuery);
  const { data: schools } = useCollection<SchoolXperience>(schoolsQuery);

  const filtered = (flaggedVisits || []).filter((v) => {
    const matchesSearch =
      !search ||
      v.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
      v.visitor?.toLowerCase().includes(search.toLowerCase());
    const matchesProgramme =
      filterProgramme === 'All' ||
      v.programmesCovered?.includes(filterProgramme as any);
    return matchesSearch && matchesProgramme;
  });

  const grouped = filtered.reduce<Record<string, SchoolVisitXperience[]>>((acc, visit) => {
    const key = visit.schoolId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(visit);
    return acc;
  }, {});

  const schoolsWithFlagged = Object.entries(grouped);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Video}
        title="Story Hub"
        description="Visits flagged by the field team as story candidates — ready for Alex's media team to develop into narratives."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Story Hub', href: '/school-xperience/stories' },
        ]}
      />

      <Card className="border-primary/30 bg-primary/5 shadow-comic-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <Video className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">For Alex's Media Team</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'Counting...' : `${flaggedVisits?.length || 0} visit${(flaggedVisits?.length || 0) !== 1 ? 's' : ''} flagged across ${schoolsWithFlagged.length} school${schoolsWithFlagged.length !== 1 ? 's' : ''}. 
              Each story candidate has been identified by the field team as having strong narrative potential.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by school or visitor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-11 rounded-xl border border-input bg-background px-4 text-sm font-bold placeholder:text-muted-foreground"
        />
        <select
          value={filterProgramme}
          onChange={(e) => setFilterProgramme(e.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
        >
          <option value="All">All Programmes</option>
          <option value="SLF">SLF</option>
          <option value="RED">RED</option>
          <option value="GreenSchools">GreenSchools</option>
          <option value="PureWater">PureWater</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-lg">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-lg">No story candidates yet</p>
            <p className="text-sm mt-1">Field visits flagged with "Flag for Story" will appear here.</p>
            <Button asChild className="mt-6 btn-omuto rounded-xl">
              <Link href="/school-xperience">Back to Hub</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {schoolsWithFlagged.map(([schoolId, visits]) => {
            const school = schools?.find((s) => s.id === schoolId);
            return (
              <Card key={schoolId} className="border-lg shadow-comic-sm">
                <CardHeader className="bg-muted/30 border-b-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-black">{school?.schoolName || 'Unknown School'}</CardTitle>
                        {school?.location && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {school.location}
                            {school.subCounty && `, ${school.subCounty}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {school?.activeProgrammes?.map((p) => {
                        const Icon = PROGRAMME_ICONS[p] || Star;
                        return (
                          <Badge key={p} className={`text-xs font-bold border ${PROGRAMME_COLORS[p]}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {p}
                          </Badge>
                        );
                      })}
                      <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs font-bold" asChild>
                        <Link href={`/school-xperience/${schoolId}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border border-dashed rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{visit.date}</span>
                            <Badge variant="outline" className="text-xs font-bold gap-1 text-primary border-primary/30">
                              <Star className="h-3 w-3 fill-current" />
                              Story Candidate
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">by {visit.visitor}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {visit.programmesCovered?.map((p) => {
                          const Icon = PROGRAMME_ICONS[p] || Star;
                          return (
                            <Badge key={p} variant="outline" className="text-xs font-bold gap-1">
                              <Icon className="h-3 w-3" />
                              {p}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="space-y-2 mt-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Objectives Met</p>
                          <p className="text-sm">{visit.objectivesMet}</p>
                        </div>
                        {visit.teacherFeedback && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Teacher Feedback</p>
                            <p className="text-sm text-muted-foreground">{visit.teacherFeedback}</p>
                          </div>
                        )}
                        {visit.studentFeedback && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Student Feedback</p>
                            <p className="text-sm text-muted-foreground">{visit.studentFeedback}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold" asChild>
                          <Link href={`/school-xperience/${schoolId}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View Full Profile
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold" asChild>
                          <Link href={`/school-xperience/log-visit?schoolId=${schoolId}&schoolName=${encodeURIComponent(visit.schoolName || '')}`}>
                            <ClipboardCheck className="mr-1 h-3 w-3" />
                            Log New Visit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
