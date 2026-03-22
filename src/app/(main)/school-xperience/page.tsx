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
  Clock,
  CheckCircle2,
  LayoutGrid,
  List,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import type { SchoolXperience, SchoolVisitXperience } from '@/lib/types';
import { format } from 'date-fns';
import { useLastSync } from '@/hooks/use-form-submission';

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
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');
  const lastSync = useLastSync();

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

  const getVisitStatus = (schoolId: string): { label: string; color: string; bgColor: string; urgency: 'red' | 'yellow' | 'green' } => {
    const schoolVisits = visits?.filter((v) => v.schoolId === schoolId) || [];
    const lastVisit = schoolVisits[0];
    if (!lastVisit) {
      return { label: 'No visits', color: 'text-red-600', bgColor: 'bg-red-100', urgency: 'red' };
    }
    const dateVal = lastVisit.date as any;
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    const daysSince = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      return { label: `${daysSince}d overdue`, color: 'text-red-600', bgColor: 'bg-red-100', urgency: 'red' };
    }
    if (daysSince > 14) {
      return { label: `Due soon (${daysSince}d ago)`, color: 'text-yellow-600', bgColor: 'bg-yellow-100', urgency: 'yellow' };
    }
    return { label: `${daysSince}d ago`, color: 'text-green-600', bgColor: 'bg-green-100', urgency: 'green' };
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Building2}
        title="School Xperience"
        description="Manage the School Partnership Programme — track partner schools, visits, scorecards, and term progress across all 4 programmes."
        breadcrumbs={[{ name: 'Dashboard', href: '/' }, { name: 'School Xperience', href: '/school-xperience' }]}
      />

      {lastSync && (
        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <Wifi className="h-3.5 w-3.5" />
          <span>Synced {format(lastSync, 'MMM d, h:mm a')}</span>
          <span className="text-muted-foreground font-normal">— all submissions up to date</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Building2}
          label="Partner Schools"
          value={schoolsLoading ? '—' : stats.total}
          sub={`${stats.tierCounts.Flagship} Flagship, ${stats.tierCounts.Advanced} Advanced`}
          color="text-blue-600"
          alertLevel={stats.total === 0 ? 'red' : stats.total < 5 ? 'yellow' : 'green'}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Visits This Month"
          value={stats.visitsThisMonth}
          sub="monitoring visits logged"
          color="text-green-600"
          alertLevel={stats.visitsThisMonth === 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={AlertCircle}
          label="Schools Due a Visit"
          value={stats.schoolsDue}
          sub="overdue by 30+ days"
          color={stats.schoolsDue > 0 ? 'text-red-600' : 'text-green-600'}
          alertLevel={stats.schoolsDue > 5 ? 'red' : stats.schoolsDue > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          icon={Calendar}
          label="Active Term"
          value="Term 1"
          sub="2026 Academic Year"
          color="text-purple-600"
          alertLevel="green"
        />
      </div>

      <div className="bg-white rounded-2xl border-lg border-omuto-navy/20 p-5 shadow-comic-sm sticky top-[4.5rem] z-30 -mx-4 sm:mx-0 sm:static sm:sticky-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-omuto-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-omuto-red" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">What would you like to do?</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          <Button asChild className="btn-omuto h-auto py-4 rounded-2xl flex-col gap-2 shadow-comic-md relative overflow-hidden group border-2 border-transparent hover:border-white/50 transition-all">
            <Link href="/school-xperience/log-visit">
              <span className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
              <ClipboardCheck className="h-6 w-6" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight">Log Visit</span>
              <span className="text-[9px] opacity-70 font-medium leading-tight">Most used</span>
            </Link>
          </Button>
          <Button asChild className="btn-omuto h-auto py-4 rounded-2xl flex-col gap-2 shadow-comic relative overflow-hidden">
            <Link href="/school-xperience/submit-scorecard">
              <span className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
              <StarHalf className="h-6 w-6" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight">Scorecard</span>
            </Link>
          </Button>
          <Button asChild className="btn-omuto h-auto py-4 rounded-2xl flex-col gap-2 shadow-comic relative overflow-hidden">
            <Link href="/school-xperience/add-leader">
              <span className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
              <Users className="h-6 w-6" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight">Add Leader</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/log-impact">
              <MapIcon className="h-6 w-6 text-green-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-green-700">Log Impact</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/pipeline">
              <GitBranch className="h-6 w-6 text-blue-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-blue-700">Pipeline</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/planner">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-purple-700">Planner</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/impact-data">
              <MapIcon className="h-6 w-6 text-cyan-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-cyan-700">Impact Data</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/stories">
              <Video className="h-6 w-6 text-amber-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-amber-700">Stories</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 rounded-2xl flex-col gap-2 shadow-sm border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 hover:border-teal-300 hover:-translate-y-0.5 transition-all">
            <Link href="/school-xperience/impact">
              <Sparkles className="h-6 w-6 text-teal-600" />
              <span className="font-black text-[11px] uppercase tracking-widest leading-tight text-teal-700">Impact</span>
            </Link>
          </Button>
        </div>
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
            <div className="flex h-11 rounded-xl border-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-omuto-navy text-white'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
                title="Compact view"
              >
                <List className="h-4 w-4" />
                <span className="text-xs font-bold hidden sm:inline">Compact</span>
              </button>
              <button
                onClick={() => setViewMode('expanded')}
                className={`px-3 flex items-center gap-1.5 transition-colors border-l ${
                  viewMode === 'expanded'
                    ? 'bg-omuto-navy text-white'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
                title="Expanded view"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-xs font-bold hidden sm:inline">Expanded</span>
              </button>
            </div>
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
            viewMode === 'compact' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredSchools.map((school) => {
                    const visitStatus = getVisitStatus(school.id);
                    return (
                      <Link
                        key={school.id}
                        href={`/school-xperience/${school.id}`}
                        className={`block border-lg rounded-xl p-3 hover:bg-muted/30 transition-all border-l-4 ${
                          visitStatus.urgency === 'red' ? 'border-l-red-500' :
                          visitStatus.urgency === 'yellow' ? 'border-l-yellow-500' :
                          'border-l-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-sm truncate flex-1">{school.schoolName}</h3>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${visitStatus.bgColor} ${visitStatus.color}`}>
                            {visitStatus.urgency === 'red' ? <AlertCircle className="h-2.5 w-2.5" /> :
                             visitStatus.urgency === 'yellow' ? <Clock className="h-2.5 w-2.5" /> :
                             <CheckCircle2 className="h-2.5 w-2.5" />}
                            {visitStatus.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge className={`text-[10px] font-bold border ${TIER_COLORS[school.tier || 'Partner']}`}>
                            {school.tier || 'Partner'}
                          </Badge>
                          <Badge className={`text-[10px] font-bold border ${STATUS_COLORS[school.status || 'Registered']}`}>
                            {school.status || 'Registered'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          {school.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                              {school.location}
                            </span>
                          )}
                          {school.activeProgrammes && school.activeProgrammes.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              {school.activeProgrammes.map((p) => {
                                const Icon = PROGRAMME_ICONS[p] || Star;
                                return <Icon key={p} className="h-2.5 w-2.5" />;
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <Button
                            size="sm"
                            asChild
                            className="h-6 rounded-lg text-[10px] font-black flex-1"
                          >
                            <Link href={`/school-xperience/log-visit?schoolId=${school.id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                              <ClipboardCheck className="h-2.5 w-2.5 mr-0.5" />
                              Visit
                            </Link>
                          </Button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSchools.map((school) => {
                  const visitStatus = getVisitStatus(school.id);
                  return (
                    <div
                      key={school.id}
                      className={`border-lg rounded-2xl p-4 hover:bg-muted/30 transition-colors border-l-4 ${
                        visitStatus.urgency === 'red' ? 'border-l-red-500' :
                        visitStatus.urgency === 'yellow' ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}
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
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${visitStatus.bgColor} ${visitStatus.color}`}>
                               {visitStatus.urgency === 'red' ? <AlertCircle className="h-3 w-3 inline mr-1" /> :
                               visitStatus.urgency === 'yellow' ? <Clock className="h-3 w-3 inline mr-1" /> :
                               <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                              {visitStatus.label}
                            </span>
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
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, alertLevel }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  alertLevel?: 'green' | 'yellow' | 'red';
}) {
  const alertDot = alertLevel === 'red' ? (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  ) : alertLevel === 'yellow' ? (
    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
  ) : alertLevel === 'green' ? (
    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
  ) : null;

  const borderColor = alertLevel === 'red' ? 'border-l-4 border-l-red-500' : alertLevel === 'yellow' ? 'border-l-4 border-l-yellow-500' : alertLevel === 'green' ? 'border-l-4 border-l-green-500' : '';

  return (
    <Card className={`border-lg shadow-comic-sm ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          </div>
          {alertDot}
        </div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
