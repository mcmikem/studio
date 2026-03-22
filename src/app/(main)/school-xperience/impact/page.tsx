'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, getDocs, Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { DistrictKey } from '@/lib/uganda-data';
import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  Heart,
  Flower2,
  Droplets,
  Users,
  Sparkles,
  Star,
  TreePine,
  Award,
  RefreshCw,
  Map as MapIcon,
  Target,
} from 'lucide-react';
import type { SchoolXperience, SchoolLeader, SchoolVisitXperience } from '@/lib/types';
import { ScopeImpactDashboard } from '@/components/school-xperience/scope-impact-dashboard';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { SyncedStatsDashboard } from '@/components/school-xperience/synced-stats-dashboard';
import { UGANDA_LOCATIONS } from '@/lib/uganda-data';

type ImpactStats = {
  totalSchools: number;
  activeSchools: number;
  totalVisits: number;
  totalLeaders: number;
  girlsReachedRED: number;
  treesPlantedGS: number;
  studentLeadersSLF: number;
  waterReachedPW: number;
  visitsThisTerm: number;
  flaggedStories: number;
};

export default function ImpactSnapshotPage() {
  const firestore = useFirestore();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictKey>('mpigi');

  const districts: { key: DistrictKey; label: string }[] = [
    { key: 'mpigi', label: 'Mpigi' },
    { key: 'butambala', label: 'Butambala' },
    { key: 'masaka', label: 'Masaka' },
    { key: 'wakiso', label: 'Wakiso' },
    { key: 'kalungu', label: 'Kalungu' },
    { key: 'kampala', label: 'Kampala' },
  ];

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-visits'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const leadersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-leaders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schools, isLoading: schoolsLoading } = useCollection<SchoolXperience>(schoolsQuery);
  const { data: visits } = useCollection<SchoolVisitXperience>(visitsQuery);
  const { data: leaders } = useCollection<SchoolLeader>(leadersQuery);

  useEffect(() => {
    if (schoolsLoading || !schools) return;

    const computeStats = async () => {
      const now = new Date();
      const termStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const toDate = (date: any): Date => {
        if (date instanceof Timestamp) {
          return date.toDate();
        }
        return new Date(date);
      };

      const visitsThisTerm = (visits || []).filter((v) => {
        const d = toDate(v.date);
        return d >= termStart;
      }).length;

      const visitsThisMonth = (visits || []).filter((v) => {
        const d = toDate(v.date);
        return d >= thirtyDaysAgo;
      }).length;

      const flaggedStories = (visits || []).filter((v) => v.flagForStory).length;

      const girlsRED = (visits || []).filter((v) =>
        v.programmesCovered?.includes('RED')
      ).length * 15;

      const treesGS = (visits || []).filter((v) =>
        v.programmesCovered?.includes('GreenSchools')
      ).length * 20;

      setStats({
        totalSchools: schools.length,
        activeSchools: schools.filter((s) => s.status === 'Active' || s.pipelineStage === 'Onboarded').length,
        totalVisits: (visits || []).length,
        totalLeaders: (leaders || []).length,
        girlsReachedRED: girlsRED,
        treesPlantedGS: treesGS,
        studentLeadersSLF: (leaders || []).filter((l) => {
          const school = schools.find((s) => s.id === l.schoolId);
          return school?.activeProgrammes?.includes('SLF');
        }).length,
        waterReachedPW: (visits || []).filter((v) =>
          v.programmesCovered?.includes('PureWater')
        ).length * 50,
        visitsThisTerm,
        flaggedStories,
      });
      setLoading(false);
    };

    computeStats();
  }, [schools, schoolsLoading, visits, leaders]);

  if (loading || schoolsLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={Sparkles}
          title="Impact Snapshot"
          description="Auto-aggregated impact data across all School Xperience programmes."
          breadcrumbs={[
            { name: 'Dashboard', href: '/' },
            { name: 'School Xperience', href: '/school-xperience' },
            { name: 'Impact', href: '/school-xperience/impact' },
          ]}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Sparkles}
        title="Impact Snapshot"
        description="Auto-aggregated impact data across all School Xperience programmes."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Impact', href: '/school-xperience/impact' },
        ]}
      />

      <div className="bg-white rounded-2xl border-lg border-omuto-navy/20 p-5 shadow-comic-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Data</p>
            <p className="text-xs text-muted-foreground">Updated {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-2" asChild>
            <Link href="/school-xperience/impact-data">
              <MapIcon className="mr-1 h-3 w-3" />
              View Impact Data
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-2" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-12 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <Sparkles className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="scope" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <Target className="mr-2 h-4 w-4" />
            Scope vs Impact
          </TabsTrigger>
          <TabsTrigger value="map" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <MapIcon className="mr-2 h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ImpactCard
              icon={Building2}
              label="Partner Schools"
              value={stats.totalSchools}
              sub={`${stats.activeSchools} active`}
              color="text-blue-600"
              bg="bg-blue-50"
              loading={loading}
            />
            <ImpactCard
              icon={Heart}
              label="Girls Reached (RED)"
              value={stats.girlsReachedRED}
              sub="estimated via visit count"
              color="text-pink-600"
              bg="bg-pink-50"
              loading={loading}
            />
            <ImpactCard
              icon={TreePine}
              label="Trees Planted (GS)"
              value={stats.treesPlantedGS}
              sub="estimated via visit count"
              color="text-green-600"
              bg="bg-green-50"
              loading={loading}
            />
            <ImpactCard
              icon={Award}
              label="Student Leaders (SLF)"
              value={stats.studentLeadersSLF}
              sub="across all schools"
              color="text-orange-600"
              bg="bg-orange-50"
              loading={loading}
            />
            <ImpactCard
              icon={Users}
              label="Total Leaders"
              value={stats.totalLeaders}
              sub="all programmes"
              color="text-purple-600"
              bg="bg-purple-50"
              loading={loading}
            />
            <ImpactCard
              icon={GraduationCap}
              label="Schools Visited"
              value={stats.totalVisits}
              sub={`${stats.visitsThisTerm} this term`}
              color="text-teal-600"
              bg="bg-teal-50"
              loading={loading}
            />
            <ImpactCard
              icon={Droplets}
              label="Clean Water Reached"
              value={stats.waterReachedPW}
              sub="estimated via visit count"
              color="text-cyan-600"
              bg="bg-cyan-50"
              loading={loading}
            />
            <ImpactCard
              icon={Star}
              label="Story Candidates"
              value={stats.flaggedStories}
              sub="flagged by field team"
              color="text-amber-600"
              bg="bg-amber-50"
              loading={loading}
            />
          </div>

          <Card className="border-lg shadow-comic-sm mt-6">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Programme Breakdown</CardTitle>
                  <CardDescription>Schools and visits per programme</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { prog: 'RED Campaign', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', col: 'border-pink-200' },
                  { prog: 'GreenSchools', icon: Flower2, color: 'text-green-600', bg: 'bg-green-50', col: 'border-green-200' },
                  { prog: 'SLF', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', col: 'border-blue-200' },
                  { prog: 'PureWater', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', col: 'border-cyan-200' },
                ].map(({ prog, icon: Icon, color, bg, col }) => {
                  const progSchools = (schools || []).filter((s) => s.activeProgrammes?.includes(prog as any));
                  const progVisits = (visits || []).filter((v) => v.programmesCovered?.includes(prog as any));
                  const progLeaders = (leaders || []).filter((l) => {
                    const school = (schools || []).find((s) => s.id === l.schoolId);
                    return school?.activeProgrammes?.includes(prog as any);
                  });
                  return (
                    <div key={prog} className={`border-2 rounded-2xl p-4 ${col} ${bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <h3 className="font-black text-sm uppercase tracking-widest">{prog}</h3>
                        </div>
                        {progSchools.length > 0 ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 text-muted-foreground">
                            {Math.round((progVisits.length / progSchools.length) * 100)}% coverage
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">No schools</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mb-4 border border-black/5">
                        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, (progVisits.length / Math.max(1, progSchools.length)) * 30)}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-black">{progSchools.length}</p>
                          <p className="text-xs font-bold text-muted-foreground">Schools</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{progVisits.length}</p>
                          <p className="text-xs font-bold text-muted-foreground">Visits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{progLeaders.length}</p>
                          <p className="text-xs font-bold text-muted-foreground">Leaders</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scope">
          <div className="flex flex-wrap gap-2 mb-6">
            {districts.map(d => (
              <button
                key={d.key}
                onClick={() => setSelectedDistrict(d.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border-2 ${
                  selectedDistrict === d.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted hover:border-primary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <ScopeImpactDashboard district={selectedDistrict} />
          <div className="mt-6">
            <SyncedStatsDashboard
              stats={{
                totalSchools: stats.totalSchools,
                schoolsWithCoords: (schools || []).filter(s => (s as any).coordinates).length,
                totalBeneficiaries: stats.girlsReachedRED + stats.studentLeadersSLF,
                totalVisits: stats.totalVisits,
                visitsThisMonth: Math.round(stats.totalVisits / 4),
                totalLeaders: stats.totalLeaders,
                girlsReachedRED: stats.girlsReachedRED,
                treesPlantedGS: stats.treesPlantedGS,
                waterReachedPW: stats.waterReachedPW,
                activeProgrammes: 4,
                pendingFollowUps: 0,
              }}
              filters={{ district: selectedDistrict }}
              locations={(schools || []).map(s => ({
                district: s.district,
                subcounty: s.subCounty,
                type: 'school',
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="map">
          <InteractiveMap
            locations={(schools || []).map(s => ({
              id: s.id || '',
              name: s.schoolName || 'Unknown',
              type: 'school' as const,
              coordinates: (s as any).coordinates,
              subcounty: s.subCounty,
              district: s.district,
              programme: s.activeProgrammes?.[0],
            }))}
            center={{ lat: 0.233, lng: 32.333 }}
            zoom={11}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button asChild className="flex-1 btn-omuto h-11 rounded-xl text-xs font-black uppercase tracking-widest">
          <Link href="/meal/impact-studio">View Full Impact Studio</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-11 rounded-xl text-xs font-bold">
          <Link href="/school-xperience">Back to Hub</Link>
        </Button>
      </div>
    </div>
  );
}

function ImpactCard({ icon: Icon, label, value, sub, color, bg, loading = false }: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  color: string;
  bg: string;
  loading?: boolean;
}) {
  const formatValue = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toLocaleString();
  };

  return (
    <Card className="border-lg shadow-comic-sm">
      <CardContent className="p-4">
        <div className={`inline-flex items-center justify-center p-2 rounded-xl ${bg} mb-3`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-3xl font-black">{loading ? '—' : formatValue(value)}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
