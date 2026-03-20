'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, getDocs, Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { SchoolXperience, SchoolLeader, SchoolVisitXperience } from '@/lib/types';

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

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Real-time from Firestore · Updated {new Date().toLocaleTimeString()}
        </p>
        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </div>

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

      <Card className="border-lg shadow-comic-sm">
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
                <div key={prog} className={`border rounded-2xl p-4 ${col} ${bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <h3 className="font-black text-sm uppercase tracking-widest">{prog}</h3>
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
