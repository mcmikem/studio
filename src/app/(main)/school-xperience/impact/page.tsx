'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useState, useCallback } from 'react';
import type { DistrictKey } from '@/lib/uganda-data';
import { UGANDA_LOCATIONS } from '@/lib/uganda-data';
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
  Briefcase,
  Plus,
} from 'lucide-react';
import type { SchoolXperience, SchoolLeader, SchoolVisitXperience } from '@/lib/types';
import { ScopeImpactDashboard } from '@/components/school-xperience/scope-impact-dashboard';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { SyncedStatsDashboard } from '@/components/school-xperience/synced-stats-dashboard';

const DISTRICT_META: Record<DistrictKey, { label: string; center: { lat: number; lng: number } }> = {
  mpigi: { label: 'Mpigi', center: { lat: 0.233, lng: 32.333 } },
  butambala: { label: 'Butambala', center: { lat: 0.200, lng: 32.100 } },
  masaka: { label: 'Masaka', center: { lat: -0.333, lng: 31.733 } },
  wakiso: { label: 'Wakiso', center: { lat: 0.208, lng: 32.479 } },
  kalungu: { label: 'Kalungu', center: { lat: 0.183, lng: 32.083 } },
  kampala: { label: 'Kampala', center: { lat: 0.315, lng: 32.586 } },
};

const PROGRAMMES = [
  { key: 'RED', label: 'RED Campaign', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', col: 'border-pink-200' },
  { key: 'GreenSchools', label: 'GreenSchools', icon: Flower2, color: 'text-green-600', bg: 'bg-green-50', col: 'border-green-200' },
  { key: 'SLF', label: 'Student Leaders (SLF)', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', col: 'border-blue-200' },
  { key: 'PureWater', label: 'PureWater', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', col: 'border-cyan-200' },
  { key: 'YoSkills', label: 'YoSkills', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', col: 'border-amber-200' },
] as const;

export default function ImpactSnapshotPage() {
  const firestore = useFirestore();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictKey>('mpigi');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const schoolKey = `schools-${refreshKey}`;
  const schoolQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore, refreshKey]);

  const visitsKey = `visits-${refreshKey}`;
  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-visits'), orderBy('createdAt', 'desc'));
  }, [firestore, refreshKey]);

  const leadersKey = `leaders-${refreshKey}`;
  const leadersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-leaders'), orderBy('createdAt', 'desc'));
  }, [firestore, refreshKey]);

  const beneficiariesKey = `beneficiaries-${refreshKey}`;
  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-beneficiaries'), orderBy('createdAt', 'desc'));
  }, [firestore, refreshKey]);

  const treesKey = `trees-${refreshKey}`;
  const treesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trees'), orderBy('createdAt', 'desc'));
  }, [firestore, refreshKey]);

  const waterKey = `water-${refreshKey}`;
  const waterQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-water-sources'), orderBy('createdAt', 'desc'));
  }, [firestore, refreshKey]);

  const { data: allSchools, isLoading: schoolsLoading } = useCollection<SchoolXperience>(schoolQuery);
  const { data: allVisits } = useCollection<SchoolVisitXperience>(visitsQuery);
  const { data: allLeaders } = useCollection<SchoolLeader>(leadersQuery);
  const { data: allBeneficiaries } = useCollection<any>(beneficiariesQuery);
  const { data: allTrees } = useCollection<any>(treesQuery);
  const { data: allWater } = useCollection<any>(waterQuery);

  const toDate = (date: any): Date => {
    if (date instanceof Timestamp) return date.toDate();
    return new Date(date);
  };

  const districtKey = selectedDistrict;
  const districtMeta = DISTRICT_META[districtKey];
  const districtLabel = districtMeta.label;

  const schools = (allSchools || []).filter(s => !districtKey || s.district === districtLabel);
  const visits = (allVisits || []).filter(v => {
    if (!districtKey) return true;
    const school = (allSchools || []).find(s => s.id === v.schoolId);
    return school?.district === districtLabel;
  });
  const leaders = (allLeaders || []).filter(l => {
    if (!districtKey) return true;
    const school = (allSchools || []).find(s => s.id === l.schoolId);
    return school?.district === districtLabel;
  });
  const beneficiaries = (allBeneficiaries || []).filter(b => {
    if (!districtKey) return true;
    const school = (allSchools || []).find(s => s.id === b.schoolId);
    return school?.district === districtLabel;
  });
  const trees = (allTrees || []).filter(t => {
    if (!districtKey) return true;
    const school = (allSchools || []).find(s => s.id === t.schoolId);
    return school?.district === districtLabel;
  });
  const water = (allWater || []).filter(w => {
    if (!districtKey) return true;
    const school = (allSchools || []).find(s => s.id === w.schoolId);
    return school?.district === districtLabel;
  });

  const now = new Date();
  const termStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'Active' || s.pipelineStage === 'Onboarded').length;
  const totalVisits = visits.length;
  const visitsThisTerm = visits.filter(v => toDate(v.date) >= termStart).length;
  const visitsThisMonth = visits.filter(v => toDate(v.date) >= thirtyDaysAgo).length;
  const flaggedStories = visits.filter(v => v.flagForStory).length;

  const totalLeaders = leaders.length;
  const slfLeaders = leaders.filter(l => {
    const school = schools.find(s => s.id === l.schoolId);
    return school?.activeProgrammes?.includes('SLF');
  }).length;
  const studentLeadersSLF = slfLeaders;

  const girlsRED = beneficiaries.filter(b => b.programme === 'RED').length;
  const treesPlantedGS = trees.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const waterReachedPW = water.filter(w => w.status === 'functional').length;

  const schoolsVisited = [...new Set(visits.map(v => v.schoolId).filter(Boolean))].length;

  const loading = schoolsLoading;

  const mapLocations: MapLocation[] = [
    ...(districtKey === 'mpigi' ? [{
      id: 'youth-center',
      name: 'Omuto Youth Center',
      type: 'office' as const,
      coordinates: { lat: 0.0897, lng: 32.2456 },
      district: 'Mpigi',
      subcounty: 'Kammengo',
      programme: 'Youth Programmes',
    }] : []),
    ...(districtKey === 'wakiso' ? [{
      id: 'omuto-office',
      name: 'Omuto Foundation HQ',
      type: 'office' as const,
      coordinates: { lat: 0.3512, lng: 32.4985 },
      district: 'Wakiso',
      subcounty: 'Kyebando',
      programme: 'Administration',
    }] : []),
    ...schools.map(s => ({
      id: s.id || '',
      name: s.schoolName || 'Unknown',
      type: 'school' as const,
      coordinates: (s as SchoolXperience & { coordinates?: { lat: number; lng: number } }).coordinates,
      subcounty: s.subCounty,
      district: s.district,
      programme: s.activeProgrammes?.[0],
    })),
  ];

  if (loading) {
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

      <div className="bg-white rounded-2xl border-lg border-omuto-navy/20 p-4 shadow-comic-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                Impact Data Hub
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-2" onClick={handleRefresh}>
              <RefreshCw className={`mr-1 h-3 w-3 ${refreshKey > 0 ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest self-center pr-2">District:</span>
          {(Object.keys(DISTRICT_META) as DistrictKey[]).map(d => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border-2 ${
                selectedDistrict === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-muted hover:border-primary'
              }`}
            >
              {DISTRICT_META[d].label}
            </button>
          ))}
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
              value={totalSchools}
              sub={`${activeSchools} active`}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <ImpactCard
              icon={Heart}
              label="Girls Reached (RED)"
              value={girlsRED}
              sub="registered beneficiaries"
              color="text-pink-600"
              bg="bg-pink-50"
            />
            <ImpactCard
              icon={TreePine}
              label="Trees Planted (GS)"
              value={treesPlantedGS}
              sub="trees recorded"
              color="text-green-600"
              bg="bg-green-50"
            />
            <ImpactCard
              icon={Award}
              label="Student Leaders (SLF)"
              value={studentLeadersSLF}
              sub="across all schools"
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <ImpactCard
              icon={Users}
              label="Total Leaders"
              value={totalLeaders}
              sub="all programmes"
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <ImpactCard
              icon={GraduationCap}
              label="Schools Visited"
              value={schoolsVisited}
              sub={`${visitsThisMonth} this month`}
              color="text-teal-600"
              bg="bg-teal-50"
            />
            <ImpactCard
              icon={Droplets}
              label="Clean Water Sites"
              value={waterReachedPW}
              sub="functional sources"
              color="text-cyan-600"
              bg="bg-cyan-50"
            />
            <ImpactCard
              icon={Star}
              label="Story Candidates"
              value={flaggedStories}
              sub="flagged by field team"
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          <Card className="border-lg shadow-comic-sm mt-6">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Programme Breakdown</CardTitle>
                  <CardDescription>Schools, visits and leaders per programme in {districtLabel}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-2">
                  <Link href="/school-xperience/log-impact">
                    <Plus className="mr-1 h-3 w-3" />
                    Log Impact
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {PROGRAMMES.map(({ key, label, icon: Icon, color, bg, col }) => {
                  const progSchools = schools.filter(s => s.activeProgrammes?.includes(key));
                  const progVisits = visits.filter(v => v.programmesCovered?.includes(key));
                  const progLeaders = leaders.filter(l => {
                    const school = schools.find(s => s.id === l.schoolId);
                    return school?.activeProgrammes?.includes(key);
                  });
                  return (
                    <div key={key} className={`border-2 rounded-2xl p-4 ${col} ${bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <h3 className="font-black text-sm uppercase tracking-widest">{label}</h3>
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
          <ScopeImpactDashboard
            district={selectedDistrict}
            studentLeadersReached={studentLeadersSLF}
            girlsReached={girlsRED}
            treesPlanted={treesPlantedGS}
            waterReached={waterReachedPW}
          />
          <div className="mt-6">
            <SyncedStatsDashboard
              stats={{
                totalSchools,
                schoolsWithCoords: schools.filter(s => (s as any).coordinates).length,
                totalBeneficiaries: girlsRED + studentLeadersSLF,
                totalVisits,
                visitsThisMonth,
                totalLeaders,
                girlsReachedRED: girlsRED,
                treesPlantedGS,
                waterReachedPW,
                activeProgrammes: 5,
                pendingFollowUps: 0,
              }}
              filters={{ district: districtLabel.toLowerCase() }}
              locations={schools.map(s => ({
                district: s.district,
                subcounty: s.subCounty,
                type: 'school',
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="map">
          <div className="rounded-2xl border-lg overflow-hidden shadow-comic-sm" style={{ height: 'calc(100vh - 16rem)', minHeight: '500px' }}>
            <InteractiveMap
              key={`map-${districtKey}`}
              locations={mapLocations}
              center={districtMeta.center}
              zoom={districtKey === 'wakiso' || districtKey === 'mpigi' ? 13 : 11}
            />
          </div>
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

function ImpactCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  color: string;
  bg: string;
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
        <p className="text-3xl font-black">{formatValue(value)}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
