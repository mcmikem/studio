'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ArrowRight,
  AlertCircle,
  StarHalf,
  GitBranch,
  Video,
  Sparkles,
  Map as MapIcon,
  Clock,
  CheckCircle2,
  LayoutGrid,
  List,
  Wifi,
  TrendingUp,
  Zap,
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
  Partner: 'border-blue-200 bg-blue-50 text-blue-700',
  Active: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  Advanced: 'border-orange-200 bg-orange-50 text-orange-700',
  Flagship: 'border-green-200 bg-green-50 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  Registered: 'border-gray-200 bg-gray-50 text-gray-700',
  Launched: 'border-blue-200 bg-blue-50 text-blue-700',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Completed: 'border-purple-200 bg-purple-50 text-purple-700',
  Inactive: 'border-rose-200 bg-rose-50 text-rose-700',
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

    return { total: schoolList.length, visitsThisMonth, schoolsDue, tierCounts };
  }, [schools, visits]);

  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    return schools.filter((school) => {
      const matchesSearch =
        !search ||
        school.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
        school.location?.toLowerCase().includes(search.toLowerCase());
      const matchesTier = filterTier === 'All' || school.tier === filterTier;
      const matchesStatus = filterStatus === 'All' || school.status === filterStatus;
      const matchesProgramme =
        filterProgramme === 'All' || school.activeProgrammes?.includes(filterProgramme as any);
      return matchesSearch && matchesTier && matchesStatus && matchesProgramme;
    });
  }, [schools, search, filterTier, filterStatus, filterProgramme]);

  const getVisitStatus = (schoolId: string): { label: string; color: string; bgColor: string; urgency: 'red' | 'yellow' | 'green' } => {
    const schoolVisits = visits?.filter((v) => v.schoolId === schoolId) || [];
    const lastVisit = schoolVisits[0];
    if (!lastVisit) {
      return { label: 'No visits', color: 'text-rose-600', bgColor: 'bg-rose-100', urgency: 'red' };
    }
    const dateVal = lastVisit.date as any;
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    const daysSince = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      return { label: `${daysSince}d overdue`, color: 'text-rose-600', bgColor: 'bg-rose-100', urgency: 'red' };
    }
    if (daysSince > 14) {
      return { label: `Due soon (${daysSince}d ago)`, color: 'text-amber-600', bgColor: 'bg-amber-100', urgency: 'yellow' };
    }
    return { label: `${daysSince}d ago`, color: 'text-emerald-600', bgColor: 'bg-emerald-100', urgency: 'green' };
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        icon={Building2}
        title="School Xperience"
        description="The heart of Omuto’s field operations. Manage partner schools, track impact, and scale the mission."
        breadcrumbs={[{ name: 'Dashboard', href: '/' }, { name: 'School Xperience', href: '/school-xperience' }]}
      />

      {/* Premium Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Partner Schools"
          value={schoolsLoading ? '—' : stats.total}
          trend="+3 this week"
          color="text-blue-600"
          alertLevel={stats.total === 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Field Visits"
          value={stats.visitsThisMonth}
          trend="82% on goal"
          color="text-emerald-600"
          alertLevel={stats.visitsThisMonth === 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={Zap}
          label="Growth Score"
          value="9.2"
          trend="+0.4 pts"
          color="text-amber-600"
          alertLevel="green"
        />
        <StatCard
          icon={Clock}
          label="Overdue Visits"
          value={stats.schoolsDue}
          trend={stats.schoolsDue > 0 ? "Needs action" : "all clear"}
          color={stats.schoolsDue > 0 ? "text-rose-600" : "text-emerald-600"}
          alertLevel={stats.schoolsDue > 5 ? 'red' : stats.schoolsDue > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Bento Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Main High Frequency Section */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BentoButton
                href="/school-xperience/log-visit"
                icon={ClipboardCheck}
                title="Log School Visit"
                description="Record session delivery, attendance, and field observations."
                variant="primary"
                size="large"
            />
            <BentoButton
                href="/school-xperience/submit-scorecard"
                icon={StarHalf}
                title="Termly Scorecard"
                description="Submit comprehensive termly progress across all programs."
                variant="accent"
                size="large"
            />
        </div>

        {/* Secondary Actions Section */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
             <BentoButton
                href="/school-xperience/pipeline"
                icon={GitBranch}
                title="Pipeline"
                variant="secondary"
            />
            <BentoButton
                href="/school-xperience/planner"
                icon={Calendar}
                title="Planner"
                variant="secondary"
            />
             <BentoButton
                href="/school-xperience/log-impact"
                icon={MapIcon}
                title="Impact Map"
                variant="tertiary"
            />
             <BentoButton
                href="/school-xperience/stories"
                icon={Video}
                title="Stories"
                variant="tertiary"
            />
        </div>
      </div>

      {/* Registry Section */}
      <Card className="border-lg border-omuto-navy/10 shadow-comic-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-omuto-cream/20 border-b-lg border-omuto-navy/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter uppercase text-omuto-navy">
                <div className="p-2 bg-primary rounded-xl text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                School Registry
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest mt-1">
                {schoolsLoading ? 'Syncing...' : `${filteredSchools.length} Schools Active`}
              </CardDescription>
            </div>
            <Button asChild className="btn-omuto h-12 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest shadow-comic-sm">
              <Link href="/school-xperience/register-school">
                <Plus className="mr-2 h-4 w-4" />
                Register New School
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-omuto-navy/30" />
              <Input
                placeholder="Find a school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl border-lg bg-white/70"
              />
            </div>
            
            <div className="flex items-center gap-2">
                <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="h-11 rounded-xl border-lg px-4 text-[10px] font-black uppercase tracking-wider bg-white/70 cursor-pointer"
                >
                <option value="All">All Tiers</option>
                {Object.keys(TIER_COLORS).map(tier => <option key={tier} value={tier}>{tier}</option>)}
                </select>
                
                <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 rounded-xl border-lg px-4 text-[10px] font-black uppercase tracking-wider bg-white/70 cursor-pointer"
                >
                <option value="All">All Status</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="flex h-11 rounded-xl border-lg overflow-hidden bg-white/70">
              <button
                onClick={() => setViewMode('compact')}
                className={`px-4 flex items-center transition-all ${
                  viewMode === 'compact'
                    ? 'bg-omuto-navy text-white'
                    : 'text-omuto-navy/40 hover:bg-muted font-black text-[9px] uppercase tracking-widest'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('expanded')}
                className={`px-4 flex items-center transition-all border-l ${
                  viewMode === 'expanded'
                    ? 'bg-omuto-navy text-white'
                    : 'text-omuto-navy/40 hover:bg-muted font-black text-[9px] uppercase tracking-widest'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Registry Content */}
          {schoolsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-omuto-navy/10">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-omuto-navy/10" />
              <p className="font-heading text-xl font-black text-omuto-navy/30 uppercase tracking-tighter">No schools matching your filters</p>
              <Button onClick={() => {setSearch(''); setFilterTier('All'); setFilterStatus('All');}} variant="link" className="text-primary font-bold">Clear all filters</Button>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSchools.map((school) => (
                    <SchoolCard 
                        key={school.id} 
                        school={school} 
                        viewMode={viewMode}
                        visitStatus={getVisitStatus(school.id)}
                    />
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SchoolCard({ school, viewMode, visitStatus }: { school: SchoolXperience, viewMode: 'compact' | 'expanded', visitStatus: any }) {
    return (
        <Link href={`/school-xperience/${school.id}`} className="group">
            <Card className={`h-full border-2 border-omuto-navy/5 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-comic-sm group-hover:border-omuto-navy/20 relative overflow-hidden ${
                viewMode === 'compact' ? 'rounded-xl' : 'rounded-[2rem]'
            }`}>
               {/* Impact Pulse Indicator */}
               <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-12 -translate-y-12 transition-transform group-hover:scale-110 ${
                    visitStatus.urgency === 'red' ? 'bg-rose-500' :
                    visitStatus.urgency === 'yellow' ? 'bg-amber-500' :
                    'bg-emerald-500'
                }`} />

               <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-heading text-xl font-black text-omuto-navy tracking-tight group-hover:text-primary transition-colors">{school.schoolName}</h3>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${visitStatus.bgColor} ${visitStatus.color} shadow-sm border border-black/5`}>
                                    {visitStatus.urgency === 'green' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                    {visitStatus.label}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-omuto-navy/40 font-bold uppercase tracking-widest">
                                <MapPin className="h-3 w-3" />
                                {school.location || 'Location Pending'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <Badge variant="outline" className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm ${TIER_COLORS[school.tier || 'Partner']}`}>
                            {school.tier || 'Partner'}
                        </Badge>
                        <Badge variant="outline" className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm ${STATUS_COLORS[school.status || 'Active']}`}>
                            {school.status || 'Active'}
                        </Badge>
                    </div>

                    {viewMode === 'expanded' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-omuto-navy/5">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">Active Programs</span>
                                <div className="flex gap-1.5">
                                    {school.activeProgrammes?.map(p => {
                                        const Icon = PROGRAMME_ICONS[p] || Sparkles;
                                        return (
                                            <div key={p} className="p-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10">
                                                <Icon className="h-3 w-3" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">Enrollment</span>
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3 w-3 text-omuto-navy/50" />
                                    <span className="text-xs font-black text-omuto-navy italic">{school.enrollmentSize || '—'}</span>
                                </div>
                            </div>
                        </div>
                    )}
               </CardContent>
            </Card>
        </Link>
    )
}

function BentoButton({ href, icon: Icon, title, description, variant = 'secondary', size = 'small' }: { 
    href: string, icon: any, title: string, description?: string, variant?: 'primary' | 'secondary' | 'accent' | 'tertiary', size?: 'small' | 'large' 
}) {
    const variants = {
        primary: "bg-omuto-navy text-white hover:bg-primary border-4 border-omuto-navy/10",
        secondary: "bg-white text-omuto-navy hover:bg-primary/5 border-2 border-omuto-navy/5",
        accent: "bg-primary text-white hover:opacity-90 border-4 border-primary/20",
        tertiary: "bg-omuto-cream/50 text-omuto-navy hover:bg-omuto-cream border-2 border-omuto-navy/5"
    }

    return (
        <Link href={href} className="group h-full">
            <div className={`p-6 rounded-[2rem] h-full flex flex-col justify-between transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-comic-sm ${variants[variant]}`}>
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${variant === 'primary' || variant === 'accent' ? 'bg-white/10 ring-4 ring-white/5' : 'bg-primary/10 ring-4 ring-primary/5 text-primary'} transition-all group-hover:scale-110`}>
                        <Icon className={size === 'large' ? "h-7 w-7" : "h-5 w-5"} />
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-8">
                    <h3 className={`font-heading ${size === 'large' ? 'text-2xl' : 'text-sm'} font-black tracking-tighter uppercase mb-1`}>{title}</h3>
                    {description && <p className={`text-[10px] font-medium leading-tight opacity-70`}>{description}</p>}
                </div>
            </div>
        </Link>
    )
}

function StatCard({ icon: Icon, label, value, trend, color, alertLevel }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend: string;
  color: string;
  alertLevel?: 'green' | 'yellow' | 'red';
}) {
  const alertColors: Record<string, string> = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-rose-500"
  };

  return (
    <Card className="relative overflow-hidden border-2 border-omuto-navy/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-comic-sm rounded-[2rem]">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 bg-muted/50 rounded-2xl ${color} shadow-sm ring-4 ring-muted/20`}>
            <Icon className="h-5 w-5" />
          </div>
          {alertLevel && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-full border border-omuto-navy/5">
                <div className={`h-1.5 w-1.5 rounded-full ${alertColors[alertLevel] || 'bg-gray-400'} animate-pulse`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-omuto-navy/40">{alertLevel}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">{label}</h4>
          <p className="font-heading text-3xl font-black text-omuto-navy leading-none tracking-tight">{value}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-omuto-navy/5 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600/80">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
