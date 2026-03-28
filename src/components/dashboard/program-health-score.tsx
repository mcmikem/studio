'use client';

import { useEffect, useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where, or, Timestamp } from 'firebase/firestore';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart, Leaf, Droplets, Zap, Users, Swords, TrendingUp, Store,
  Activity, TrendingDown, Minus, ChevronRight, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { subDays } from 'date-fns';

interface ProgramScore {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  recentActivity: number;
  previousActivity: number;
  beneficiaries: number;
  collectionsActive: number;
  collectionsTotal: number;
  overallScore: number;
  health: 'green' | 'amber' | 'red';
  trend: 'up' | 'down' | 'stable';
  collections: string[];
}

const PROGRAMS = [
  {
    id: 'red-campaign',
    name: 'RED Campaign',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    collections: ['school-visits', 'pads-distributions', 'mhm-trainings'],
  },
  {
    id: 'green-schools',
    name: 'GreenSchools',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    collections: ['tree-surveys', 'waste-audits', 'environmental-clubs'],
  },
  {
    id: 'pure-water',
    name: 'PureWater',
    icon: Droplets,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    collections: ['water-sources', 'wash-assessments'],
  },
  {
    id: 'yoskills',
    name: 'YoSkills',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 border-amber-200',
    collections: ['yoskills-circles', 'yoskills-youth', 'session-attendance', 'business-progress', 'pitch-scores'],
  },
  {
    id: 'slf',
    name: 'Student Leaders Forum',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 border-purple-200',
    collections: ['slf-schools', 'slf-prefects', 'slf-performance', 'training-attendance'],
  },
  {
    id: 'ofa',
    name: 'Omuto Football Alliance',
    icon: Swords,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    collections: ['ofa-teams', 'ofa-players', 'match-reports', 'match-summaries'],
  },
  {
    id: 'yap',
    name: 'Youth Action Pathway',
    icon: TrendingUp,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border-indigo-200',
    collections: ['yap-chapters', 'seed-grants', 'monthly-reports'],
  },
  {
    id: 'essentials',
    name: 'Omuto Essentials',
    icon: Store,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 border-teal-200',
    collections: ['sales', 'production-batches'],
  },
];

function calculateScore(program: any, recentActivity: number, previousActivity: number, beneficiaries: number, activeCollections: number): ProgramScore {
  const activityTrend = previousActivity === 0 ? (recentActivity > 0 ? 'up' : 'stable') : recentActivity > previousActivity ? 'up' : recentActivity < previousActivity ? 'down' : 'stable';
  
  const activityWeight = Math.min((recentActivity / 50) * 100, 100) * 0.4;
  const beneficiaryWeight = Math.min((beneficiaries / 100) * 100, 100) * 0.3;
  const collectionWeight = (activeCollections / program.collections.length) * 100 * 0.3;
  
  const overall = Math.round(activityWeight + beneficiaryWeight + collectionWeight);
  
  let health: 'green' | 'amber' | 'red' = 'red';
  if (overall >= 70) health = 'green';
  else if (overall >= 40) health = 'amber';

  return {
    id: program.id,
    name: program.name,
    icon: program.icon,
    color: program.color,
    bgColor: program.bgColor,
    recentActivity,
    previousActivity,
    beneficiaries,
    collectionsActive: activeCollections,
    collectionsTotal: program.collections.length,
    overallScore: overall,
    health,
    trend: activityTrend as any,
    collections: program.collections,
  };
}

async function fetchProgramData(program: { collections: string[] }, firestore: any): Promise<{ recentActivity: number; previousActivity: number; beneficiaries: number; activeCollections: number }> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  const beneficiaryCollections = new Set(['school-visits', 'pads-distributions', 'mhm-trainings', 'slf-schools', 'slf-performance', 'training-attendance', 'session-attendance']);

  const results = await Promise.allSettled(
    program.collections.map(async (colName: string) => {
      try {
        const snap = await getDocs(query(collection(firestore, colName), where('createdAt', '>=', Timestamp.fromDate(sixtyDaysAgo))));
        let recentActivity = 0;
        let previousActivity = 0;
        let beneficiaries = 0;

        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
          if (createdAt >= thirtyDaysAgo) {
            recentActivity++;
            if (beneficiaryCollections.has(colName)) beneficiaries++;
          } else {
            previousActivity++;
          }
        });

        return { recentActivity, previousActivity, beneficiaries, active: recentActivity > 0 ? 1 : 0 };
      } catch {
        return { recentActivity: 0, previousActivity: 0, beneficiaries: 0, active: 0 };
      }
    })
  );

  const totals = results.reduce(
    (acc, r) => {
      if (r.status === 'fulfilled') {
        acc.recentActivity += r.value.recentActivity;
        acc.previousActivity += r.value.previousActivity;
        acc.beneficiaries += r.value.beneficiaries;
        acc.activeCollections += r.value.active;
      }
      return acc;
    },
    { recentActivity: 0, previousActivity: 0, beneficiaries: 0, activeCollections: 0 }
  );

  return totals;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

function getCache(key: string): ProgramScore[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: ProgramScore[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage might be full
  }
}

function ProgramCard({ program, Icon }: { program: ProgramScore; Icon: React.ElementType }) {
  return (
    <div className={cn('rounded-xl border p-3 flex flex-col gap-3 hover:shadow-md transition-shadow', program.bgColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('h-4 w-4 flex-shrink-0', program.color)} />
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground truncate">
            {program.name}
          </span>
        </div>
        <ScoreRing score={program.overallScore} size={36} strokeWidth={3} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div>
          <p className="text-sm font-black">{program.recentActivity}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Activities</p>
        </div>
        <div>
          <p className="text-sm font-black">{program.beneficiaries}</p>
          <p className="text-[9px] text-muted-uppercase">Beneficiaries</p>
        </div>
        <div>
          <p className="text-sm font-black">{program.collectionsActive}/{program.collectionsTotal}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Active</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className={cn(
          'font-bold',
          program.trend === 'up' && 'text-green-600',
          program.trend === 'down' && 'text-red-600',
          program.trend === 'stable' && 'text-muted-foreground',
        )}>
          {program.trend === 'up' && <TrendingUp className="h-3 w-3 inline mr-1" />}
          {program.trend === 'down' && <TrendingDown className="h-3 w-3 inline mr-1" />}
          {program.trend === 'stable' && <Minus className="h-3 w-3 inline mr-1" />}
          {program.trend}
        </span>
        <Link href={`/meal/data/${program.id}`} className="text-primary hover:underline flex items-center gap-0.5">
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ score, size, strokeWidth }: { score: number; size: number; strokeWidth: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black">{score}</span>
      </div>
    </div>
  );
}

export function ProgramHealthScore() {
  const firestore = useFirestore();
  const [scores, setScores] = useState<ProgramScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!firestore) return;

    const CACHE_KEY = 'sx_program_health_v1';
    const cached = getCache(CACHE_KEY);
    if (cached && mountedRef.current) {
      setScores(cached);
      setIsLoading(false);
    }

    const load = async () => {
      if (!mountedRef.current) return;
      setIsRefreshing(true);
      try {
        const results = await Promise.all(
          PROGRAMS.map(async (program) => {
            const data = await fetchProgramData(program, firestore);
            return calculateScore(program, data.recentActivity, data.previousActivity, data.beneficiaries, data.activeCollections);
          })
        );
        if (mountedRef.current) {
          const sorted = results.sort((a, b) => a.overallScore - b.overallScore);
          setScores(sorted);
          setCache(CACHE_KEY, sorted);
        }
      } catch {
        // Error handled silently
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    load();

    return () => {
      mountedRef.current = false;
    };
  }, [firestore]);

  const greenCount = scores.filter(s => s.health === 'green').length;
  const amberCount = scores.filter(s => s.health === 'amber').length;
  const redCount = scores.filter(s => s.health === 'red').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Program Health Score
            </CardTitle>
            <CardDescription className="text-xs">
              {isRefreshing ? (
                <span className="text-amber-600">Refreshing...</span>
              ) : scores.length > 0 ? (
                <span>Last 30 days · {scores.reduce((s, p) => s + p.recentActivity, 0)} activities</span>
              ) : (
                <span>Loading programme data...</span>
              )}
            </CardDescription>
          </div>
          {scores.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-bold flex-shrink-0">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>{greenCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>{amberCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span>{redCount}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {scores.length === 0 && isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 opacity-30 animate-pulse" />
              <p className="text-xs font-bold">Loading programme data...</p>
            </div>
          </div>
        ) : scores.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p className="text-xs font-bold">No programme data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {scores.map(program => {
              const Icon = program.icon;
              return <ProgramCard key={program.id} program={program} Icon={Icon} />;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
