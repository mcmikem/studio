'use client';

import { useEffect, useState } from 'react';
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

function ScoreRing({ score, size = 48, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const health = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red';
  const color = health === 'green' ? '#22c55e' : health === 'amber' ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground">{score}</span>
      </div>
    </div>
  );
}

function TrendIcon({ trend, recent, previous }: { trend: 'up' | 'down' | 'stable'; recent: number; previous: number }) {
  if (trend === 'up') {
    return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function HealthDot({ health }: { health: 'green' | 'amber' | 'red' }) {
  return (
    <span className={cn(
      'h-2.5 w-2.5 rounded-full flex-shrink-0',
      health === 'green' && 'bg-green-500',
      health === 'amber' && 'bg-amber-500',
      health === 'red' && 'bg-red-500',
    )} />
  );
}

function calculateScore(program: { id: string; name: string; icon: any; color: string; bgColor: string; collections: string[] }, recentActivity: number, previousActivity: number, beneficiaries: number, activeCollections: number): ProgramScore {
  const activityScore = Math.min(100, recentActivity * 10);
  const prevScore = Math.min(100, previousActivity * 10);
  const activityTrend = recentActivity > previousActivity ? 'up' : recentActivity < previousActivity ? 'down' : 'stable';

  const beneficiaryScore = Math.min(100, beneficiaries * 2);
  const submissionScore = (activeCollections / program.collections.length) * 100;

  const overall = Math.round(activityScore * 0.4 + beneficiaryScore * 0.35 + submissionScore * 0.25);
  const health: 'green' | 'amber' | 'red' =
    overall >= 70 ? 'green' : overall >= 40 ? 'amber' : 'red';

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
    trend: activityTrend,
    collections: program.collections,
  };
}

async function fetchProgramData(program: { id: string; name: string; icon: any; color: string; bgColor: string; collections: string[] }, firestore: any): Promise<{ recentActivity: number; previousActivity: number; beneficiaries: number; activeCollections: number }> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  let recentActivity = 0;
  let previousActivity = 0;
  let activeCollections = 0;
  let beneficiaries = 0;

  const beneficiaryCollections = ['school-visits', 'pads-distributions', 'mhm-trainings', 'slf-schools', 'slf-performance', 'training-attendance', 'session-attendance'];

  for (const colName of program.collections) {
    try {
      const col = collection(firestore, colName);
      const q = query(col);

      if (beneficiaryCollections.includes(colName)) {
        const snap = await getDocs(q);
        beneficiaries += snap.size;
      }

      const recentSnap = await getDocs(q);
      const recentDocs = recentSnap.docs.filter((doc: any) => {
        const data = doc.data();
        if (!data.createdAt) return true;
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt);
        return createdAt >= thirtyDaysAgo;
      });

      const prevDocs = recentSnap.docs.filter((doc: any) => {
        const data = doc.data();
        if (!data.createdAt) return false;
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt);
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      });

      recentActivity += recentDocs.length;
      previousActivity += prevDocs.length;

      if (recentDocs.length > 0) activeCollections++;
    } catch (e) {
      // Collection might not exist yet
    }
  }

  return { recentActivity, previousActivity, beneficiaries, activeCollections };
}

function ProgramCard({ program, Icon }: { program: ProgramScore; Icon: React.ElementType }) {
  return (
    <div className={cn('rounded-xl border p-3 flex flex-col gap-3 hover:shadow-md transition-shadow min-w-[220px] snap-start', program.bgColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', program.color)} />
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground line-clamp-1">
            {program.name}
          </span>
        </div>
        <ScoreRing score={program.overallScore} size={40} strokeWidth={4} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <TrendIcon trend={program.trend} recent={program.recentActivity} previous={program.previousActivity} />
          </div>
          <p className="text-[13px] font-black text-omuto-navy">{program.recentActivity}</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Activities</p>
        </div>
        <div className="text-center">
          <Users className="h-3 w-3 text-muted-foreground mx-auto" />
          <p className="text-[13px] font-black text-omuto-navy">{program.beneficiaries}</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Beneficiaries</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <HealthDot health={program.health} />
          </div>
          <p className="text-[13px] font-black text-omuto-navy">
            {program.collectionsActive}/{program.collectionsTotal}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Forms</p>
        </div>
      </div>
      <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', program.health === 'green' && 'bg-green-500', program.health === 'amber' && 'bg-amber-500', program.health === 'red' && 'bg-red-500')} style={{ width: `${program.overallScore}%` }} />
      </div>
    </div>
  );
}

export function ProgramHealthScore() {
  const firestore = useFirestore();
  const [scores, setScores] = useState<ProgramScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const load = async () => {
      const results: ProgramScore[] = [];

      for (const program of PROGRAMS) {
        const data = await fetchProgramData(program, firestore);
        results.push(calculateScore(program, data.recentActivity, data.previousActivity, data.beneficiaries, data.activeCollections));
      }

      setScores(results.sort((a, b) => a.overallScore - b.overallScore));
      setIsLoading(false);
    };

    load();
  }, [firestore]);

  const greenCount = scores.filter(s => s.health === 'green').length;
  const amberCount = scores.filter(s => s.health === 'amber').length;
  const redCount = scores.filter(s => s.health === 'red').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Program Health Score
            </CardTitle>
            <CardDescription>
              Auto-calculated from activity frequency, beneficiary reach, and form submission rates — last 30 days.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>{greenCount} Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{amberCount} Attention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>{redCount} Critical</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {scores.map(program => {
            const Icon = program.icon;
            return (
              <ProgramCard key={program.id} program={program} Icon={Icon} />
            );
          })}
        </div>
        <div className="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {scores.map(program => {
            const Icon = program.icon;
            return (
              <ProgramCard key={program.id} program={program} Icon={Icon} />
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            href="/meal/data"
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            View detailed MEAL data
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
