'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, GraduationCap, Heart, Droplets, TreePine,
  Target, TrendingUp, Award, AlertCircle
} from 'lucide-react';
import { OMUTO_TARGETS, UGANDA_STATS, type DistrictKey } from '@/lib/uganda-data';

const DISTRICT_LABELS: Record<DistrictKey, string> = {
  mpigi: 'Mpigi',
  butambala: 'Butambala',
  masaka: 'Masaka',
  wakiso: 'Wakiso',
  kalungu: 'Kalungu',
  kampala: 'Kampala',
};

interface ScopeImpactProps {
  district?: DistrictKey;
  studentLeadersReached?: number;
  girlsReached?: number;
  treesPlanted?: number;
  waterReached?: number;
}

export function ScopeImpactDashboard({
  district = 'mpigi',
  studentLeadersReached = 0,
  girlsReached = 0,
  treesPlanted = 0,
  waterReached = 0,
}: ScopeImpactProps) {
  const targets = OMUTO_TARGETS[district] || OMUTO_TARGETS.mpigi;
  const stats = UGANDA_STATS[district] || UGANDA_STATS.mpigi;
  const waterAccess = (stats as any).waterAccessRural ?? (stats as any).waterAccessUrban ?? 50;
  const teenPregnancy = (stats as any).teenagePregnancy ?? 0;
  const label = DISTRICT_LABELS[district];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScopeCard
          icon={GraduationCap}
          title="Student Leaders (SLF)"
          reached={studentLeadersReached}
          target={Math.round(targets.students.total * targets.students.targetReach)}
          total={targets.students.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        <ScopeCard
          icon={Heart}
          title="Girls Supported (RED)"
          reached={girlsReached}
          target={Math.round(targets.menstrualHealth.schoolGirls * 0.2)}
          total={targets.menstrualHealth.schoolGirls}
          color="text-pink-600"
          bgColor="bg-pink-50"
        />

        <ScopeCard
          icon={TreePine}
          title="Trees Planted (GS)"
          reached={treesPlanted}
          target={700}
          total={undefined}
          color="text-green-600"
          bgColor="bg-green-50"
        />

        <ScopeCard
          icon={Droplets}
          title="Clean Water Reached"
          reached={waterReached}
          target={targets.water.targetInterventions}
          total={targets.water.populationWithoutAccess}
          color="text-cyan-600"
          bgColor="bg-cyan-50"
        />
      </div>

      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg">
          <CardTitle className="flex items-center gap-2 text-lg font-black">
            <Target className="h-5 w-5 text-primary" />
            Scope vs Impact Analysis
          </CardTitle>
          <CardDescription>
            {label} District — UBOS 2024 Census Data
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Population"
              value={stats.population.toLocaleString()}
              sub="UBOS 2024"
            />
            <StatCard
              label="Youth (15-24)"
              value={stats.youthPopulation.toLocaleString()}
              sub={`${Math.round((stats.youthPopulation / Math.max(1, stats.population)) * 100)}% of population`}
            />
            <StatCard
              label="Female Youth"
              value={stats.femaleYouth.toLocaleString()}
              sub="Potential beneficiaries"
            />
            <StatCard
              label="Primary Schools"
              value={targets.schools.total.toString()}
              sub={`${targets.schools.partnerTarget} partner target`}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Service Access Gaps</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GapCard
                label="Without Clean Water"
                gap={100 - waterAccess}
                total={stats.population}
                icon={Droplets}
                color="text-cyan-600"
              />
              <GapCard
                label="Girls Needing MHM Support"
                gap={Math.round((stats.femaleYouth / Math.max(1, stats.population)) * 100 * 0.4)}
                total={stats.femaleYouth}
                icon={Heart}
                color="text-pink-600"
              />
              <GapCard
                label="Vulnerable Youth"
                gap={Math.round((stats.youthPopulation / Math.max(1, stats.population)) * 100 * 0.2)}
                total={stats.youthPopulation}
                icon={Users}
                color="text-purple-600"
              />
            </div>
          </div>

          {teenPregnancy > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-800">
                  Teenage Pregnancy Context
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {teenPregnancy}% of girls aged 15-19 have begun childbearing (UBOS).
                  RED Campaign menstrual health support is critical for keeping girls in school.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg">
          <CardTitle className="flex items-center gap-2 text-lg font-black">
            <TrendingUp className="h-5 w-5 text-primary" />
            Annual Reach Targets
          </CardTitle>
          <CardDescription>
            Our yearly goals vs district population
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Student Leaders (SLF)</span>
              <span className="text-muted-foreground">
                {targets.students.yearlyTarget.toLocaleString()} / {targets.students.total.toLocaleString()}
              </span>
            </div>
            <Progress
              value={(targets.students.yearlyTarget / Math.max(1, targets.students.total)) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round((targets.students.yearlyTarget / Math.max(1, targets.students.total)) * 100)}% of students targeted per year
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Youth Entrepreneurship (YoSkills)</span>
              <span className="text-muted-foreground">
                {targets.youth.yearlyTarget.toLocaleString()} / {targets.youth.total.toLocaleString()}
              </span>
            </div>
            <Progress
              value={(targets.youth.yearlyTarget / Math.max(1, targets.youth.total)) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round((targets.youth.yearlyTarget / Math.max(1, targets.youth.total)) * 100)}% of youth targeted per year
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Schools Partnership</span>
              <span className="text-muted-foreground">
                {targets.schools.partnerTarget} / {targets.schools.total}
              </span>
            </div>
            <Progress
              value={(targets.schools.partnerTarget / Math.max(1, targets.schools.total)) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round((targets.schools.partnerTarget / Math.max(1, targets.schools.total)) * 100)}% school partnership goal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScopeCard({
  icon: Icon,
  title,
  reached,
  target,
  total,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  title: string;
  reached: number;
  target: number;
  total?: number;
  color: string;
  bgColor: string;
}) {
  const percentage = target > 0 ? Math.round((reached / target) * 100) : 0;

  return (
    <Card className="border-lg shadow-comic-sm">
      <CardContent className="p-4">
        <div className={`inline-flex items-center justify-center p-2 rounded-xl ${bgColor} mb-3`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black">{reached.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">/ {target.toLocaleString()}</span>
        </div>
        {total && (
          <p className="text-xs text-muted-foreground mt-1">
            of {total.toLocaleString()} total
          </p>
        )}
        <Progress value={percentage} className="h-1.5 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">{percentage}% reached</p>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/30">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-black mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function GapCard({
  label,
  gap,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  gap: number;
  total: number;
  icon: React.ElementType;
  color: string;
}) {
  const peopleAffected = Math.round((gap / 100) * total);

  return (
    <div className="p-4 rounded-xl border border-muted">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="font-bold text-sm">{label}</p>
      </div>
      <p className="text-2xl font-black">{gap}%</p>
      <p className="text-xs text-muted-foreground">
        ~{peopleAffected.toLocaleString()} people need intervention
      </p>
    </div>
  );
}
