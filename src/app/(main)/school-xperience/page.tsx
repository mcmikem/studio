'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Star,
  Calendar,
  Eye,
  ClipboardCheck,
  GraduationCap,
  Heart,
  Flower2,
  Droplets,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
  StarHalf,
  GitBranch,
  Video,
  Sparkles,
  Map as MapIcon,
  TreePine,
} from 'lucide-react';
import Link from 'next/link';
import type { SchoolXperience, SchoolVisitXperience } from '@/lib/types';
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

const PIPELINE_COLORS: Record<string, string> = {
  Inquiry: 'bg-gray-100 text-gray-600 border-gray-200',
  'Meeting Booked': 'bg-blue-100 text-blue-600 border-blue-200',
  'MOU Signed': 'bg-orange-100 text-orange-600 border-orange-200',
  Onboarded: 'bg-green-100 text-green-600 border-green-200',
};

export default function SchoolXperienceHubPage() {
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('All');
  const [filterProgramme, setFilterProgramme] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-visits'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schools, isLoading: schoolsLoading } = useCollection<SchoolXperience>(schoolsQuery);
  const { data: visits } = useCollection<SchoolVisitXperience>(visitsQuery);

  const stats = useMemo(() => {
    const schoolList = schools || [];
    const visitList = visits || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const visitsThisMonth = visitList.filter((v) => {
      const dateVal = v.date as any;
      const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
      return d >= thirtyDaysAgo;
    }).length;

    const schoolsDue = schoolList.filter((s) => {
      const schoolVisits = visitList.filter((v) => v.schoolId === s.id);
      const lastVisit = schoolVisits[0];
      if (!lastVisit) return true;
      const dateVal = lastVisit.date as any;
      const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
      return d < thirtyDaysAgo;
    }).length;

    const tierCounts = {
      Partner: schoolList.filter((s) => s.tier === 'Partner').length,
      Active: schoolList.filter((s) => s.tier === 'Active').length,
      Advanced: schoolList.filter((s) => s.tier === 'Advanced').length,
      Flagship: schoolList.filter((s) => s.tier === 'Flagship').length,
    };

    const programmeCounts = {
      SLF: schoolList.filter((s) => s.activeProgrammes?.includes('SLF')).length,
      RED: schoolList.filter((s) => s.activeProgrammes?.includes('RED')).length,
      GreenSchools: schoolList.filter((s) => s.activeProgrammes?.includes('GreenSchools')).length,
      PureWater: schoolList.filter((s) => s.activeProgrammes?.includes('PureWater')).length,
    };

    return { total: schoolList.length, visitsThisMonth, schoolsDue, tierCounts, programmeCounts };
  }, [schools, visits]);

  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    return schools.filter((school) => {
      const matchesSearch =
        !search ||
        school.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
        school.location?.toLowerCase().includes(search.toLowerCase()) ||
        school.patronTeacher?.toLowerCase().includes(search.toLowerCase());
      const matchesTier = filterTier === 'All' || school.tier === filterTier;
      const matchesStatus = filterStatus === 'All' || school.status === filterStatus;
      const matchesProgramme =
        filterProgramme === 'All' || school.activeProgrammes?.includes(filterProgramme as any);
      return matchesSearch && matchesTier && matchesStatus && matchesProgramme;
    });
  }, [schools, search, filterTier, filterStatus, filterProgramme]);

  const getLastVisit = (schoolId: string) => {
    if (!visits) return null;
    return visits.find((v) => v.schoolId === schoolId);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Building2}
        title="School Xperience"
        description="Manage the School Partnership Programme — track partner schools, visits, scorecards, and term progress across all 4 programmes."
        breadcrumbs={[{ name: 'Dashboard', href: '/' }, { name: 'School Xperience', href: '/school-xperience' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Partner Schools"
          value={schoolsLoading ? '—' : stats.total}
          sub={`${stats.tierCounts.Flagship} Flagship, ${stats.tierCounts.Advanced} Advanced`}
          color="text-blue-600"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Visits This Month"
          value={stats.visitsThisMonth}
          sub="monitoring visits logged"
          color="text-green-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Schools Due a Visit"
          value={stats.schoolsDue}
          sub="overdue by 30+ days"
          color={stats.schoolsDue > 0 ? 'text-red-600' : 'text-green-600'}
        />
        <StatCard
          icon={Calendar}
          label="Active Term"
          value="Term 1"
          sub="2026 Academic Year"
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        <Button asChild className="btn-omuto h-auto py-2.5 rounded-xl flex-col gap-1 shadow-comic-sm">
          <Link href="/school-xperience/log-visit">
            <ClipboardCheck className="h-4 w-4" />
            <span className="font-black text-[10px] uppercase tracking-widest">Log Visit</span>
          </Link>
        </Button>
        <Button asChild className="btn-omuto h-auto py-2.5 rounded-xl flex-col gap-1 shadow-comic-sm">
          <Link href="/school-xperience/submit-scorecard">
            <StarHalf className="h-4 w-4" />
            <span className="font-black text-[10px] uppercase tracking-widest">Scorecard</span>
          </Link>
        </Button>
        <Button asChild className="btn-omuto h-auto py-2.5 rounded-xl flex-col gap-1 shadow-comic-sm">
          <Link href="/school-xperience/add-leader">
            <Users className="h-4 w-4" />
            <span className="font-black text-[10px] uppercase tracking-widest">Add Leader</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/log-impact">
            <MapIcon className="h-4 w-4 text-green-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Log Impact</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/pipeline">
            <GitBranch className="h-4 w-4 text-blue-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Pipeline</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/planner">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Planner</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/impact-data">
            <MapIcon className="h-4 w-4 text-cyan-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Impact Data</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/stories">
            <Video className="h-4 w-4 text-amber-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Stories</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-2.5 rounded-xl flex-col gap-1 shadow-sm border-2">
          <Link href="/school-xperience/impact">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span className="font-black text-[10px] uppercase tracking-widest">Impact</span>
          </Link>
        </Button>
      </div>

      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5" />
                School Registry
              </CardTitle>
              <CardDescription>
                {schoolsLoading ? 'Loading...' : `${filteredSchools.length} of ${schools?.length || 0} schools`}
              </CardDescription>
            </div>
            <Button asChild className="btn-omuto h-11 rounded-xl text-xs font-black uppercase tracking-widest shadow-comic-sm">
              <Link href="/school-xperience/register-school">
                <Plus className="mr-2 h-4 w-4" />
                Register School
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or patron..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 rounded-xl border-lg"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="h-11 rounded-xl border-lg px-3 text-sm font-semibold bg-background"
            >
              <option value="All">All Tiers</option>
              <option value="Partner">Partner</option>
              <option value="Active">Active</option>
              <option value="Advanced">Advanced</option>
              <option value="Flagship">Flagship</option>
            </select>
            <select
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
              className="h-11 rounded-xl border-lg px-3 text-sm font-semibold bg-background"
            >
              <option value="All">All Programmes</option>
              <option value="SLF">SLF</option>
              <option value="RED">RED</option>
              <option value="GreenSchools">GreenSchools</option>
              <option value="PureWater">PureWater</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 rounded-xl border-lg px-3 text-sm font-semibold bg-background"
            >
              <option value="All">All Status</option>
              <option value="Registered">Registered</option>
              <option value="Launched">Launched</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {schoolsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No schools found</p>
              <p className="text-sm">Try adjusting your filters or register a new school.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchools.map((school) => {
                const lastVisit = getLastVisit(school.id);
                return (
                  <div
                    key={school.id}
                    className="border-lg rounded-2xl p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate">{school.schoolName}</h3>
                          <Badge className={`text-xs font-bold border ${TIER_COLORS[school.tier || 'Partner']}`}>
                            {school.tier || 'Partner'}
                          </Badge>
                          <Badge className={`text-xs font-bold border ${PIPELINE_COLORS[school.pipelineStage || 'Inquiry']}`}>
                            {school.pipelineStage || 'Inquiry'}
                          </Badge>
                          <Badge className={`text-xs font-bold border ${STATUS_COLORS[school.status || 'Registered']}`}>
                            {school.status || 'Registered'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {school.location}
                            {school.subCounty && `, ${school.subCounty}`}
                          </span>
                          {school.patronTeacher && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {school.patronTeacher}
                            </span>
                          )}
                          {school.enrollmentSize && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {school.enrollmentSize} students
                            </span>
                          )}
                        </div>
                        {school.activeProgrammes && school.activeProgrammes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {school.activeProgrammes.map((p) => {
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
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {lastVisit ? (
                          <span className="text-xs text-muted-foreground">
                            Last visit:{' '}
                            {(() => {
                              const dateVal = lastVisit.date as any;
                              const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
                              return format(d, 'MMM d');
                            })()}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No visits yet
                          </span>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-xs font-bold">
                            <Link href={`/school-xperience/log-visit?schoolId=${school.id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                              <ClipboardCheck className="mr-1 h-3 w-3" />
                              Log Visit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-xs font-bold">
                            <Link href={`/school-xperience/${school.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <Card className="border-lg shadow-comic-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
