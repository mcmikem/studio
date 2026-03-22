'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, GraduationCap, Heart, Droplets, TreePine,
  Target, TrendingUp, Award, AlertCircle, MapPin,
  Building2, Clock, Calendar
} from 'lucide-react';
import { OMUTO_TARGETS, UGANDA_STATS, UGANDA_LOCATIONS, type DistrictKey } from '@/lib/uganda-data';

interface Location {
  district?: string;
  subcounty?: string;
  parish?: string;
}

interface StatsFilters {
  district?: string;
  subcounty?: string;
  parish?: string;
  programme?: string;
  type?: string;
}

interface LocationStats {
  totalSchools: number;
  schoolsWithCoords: number;
  totalBeneficiaries: number;
  totalVisits: number;
  visitsThisMonth: number;
  totalLeaders: number;
  girlsReachedRED: number;
  treesPlantedGS: number;
  waterReachedPW: number;
  activeProgrammes: number;
  pendingFollowUps: number;
}

interface SyncedStatsDashboardProps {
  stats?: LocationStats | null;
  filters?: StatsFilters;
  locations?: Location[];
  onFilterChange?: (filters: StatsFilters) => void;
  loading?: boolean;
}

export function SyncedStatsDashboard({ 
  stats, 
  filters = {},
  locations = [],
  onFilterChange,
  loading = false 
}: SyncedStatsDashboardProps) {
  const district = (filters.district || 'mpigi') as DistrictKey;
  const targets = OMUTO_TARGETS[district] || OMUTO_TARGETS.mpigi;
  const stats_ug = UGANDA_STATS[district] || UGANDA_STATS.mpigi;
  const waterAccess = (stats_ug as any).waterAccessRural ?? (stats_ug as any).waterAccessUrban ?? 50;
  const teenPregnancy = (stats_ug as any).teenagePregnancy ?? 0;

  // Calculate reach percentages
  const studentReach = stats ? Math.round((stats.totalLeaders / targets.students.yearlyTarget) * 100) : 0;
  const waterReach = stats ? Math.round((stats.waterReachedPW / targets.water.targetInterventions) * 100) : 0;
  const schoolReach = stats ? Math.round((stats.totalSchools / targets.schools.partnerTarget) * 100) : 0;

  // Get subcounties in current district
  const districtData = UGANDA_LOCATIONS[district as keyof typeof UGANDA_LOCATIONS];
  const subcounties = districtData?.subcounties || [];

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.district && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {filters.district}
              <button onClick={() => onFilterChange?.({ ...filters, district: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          {filters.subcounty && (
            <Badge variant="outline" className="gap-1">
              {filters.subcounty}
              <button onClick={() => onFilterChange?.({ ...filters, subcounty: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          {filters.programme && (
            <Badge variant="outline" className="gap-1">
              {filters.programme}
              <button onClick={() => onFilterChange?.({ ...filters, programme: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-12 rounded-xl bg-muted/50 p-1 flex-wrap">
          <TabsTrigger value="overview" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <Target className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reach" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <TrendingUp className="mr-2 h-4 w-4" />
            Reach
          </TabsTrigger>
          <TabsTrigger value="gaps" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <AlertCircle className="mr-2 h-4 w-4" />
            Gaps
          </TabsTrigger>
          <TabsTrigger value="geography" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
            <MapPin className="mr-2 h-4 w-4" />
            Geography
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  icon={Building2}
                  label="Partner Schools"
                  value={stats?.totalSchools || 0}
                  sub={`${stats?.schoolsWithCoords || 0} with GPS`}
                  color="text-blue-600"
                  bg="bg-blue-50"
                />
                <StatCard
                  icon={Users}
                  label="Beneficiaries"
                  value={stats?.totalBeneficiaries || 0}
                  sub="directly reached"
                  color="text-purple-600"
                  bg="bg-purple-50"
                />
                <StatCard
                  icon={Clock}
                  label="Visits"
                  value={stats?.totalVisits || 0}
                  sub={`${stats?.visitsThisMonth || 0} this month`}
                  color="text-teal-600"
                  bg="bg-teal-50"
                />
                <StatCard
                  icon={Award}
                  label="Student Leaders"
                  value={stats?.totalLeaders || 0}
                  sub="trained & commissioned"
                  color="text-orange-600"
                  bg="bg-orange-50"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <StatCard
                  icon={Heart}
                  label="Girls (RED)"
                  value={stats?.girlsReachedRED || 0}
                  sub="menstrual health support"
                  color="text-pink-600"
                  bg="bg-pink-50"
                />
                <StatCard
                  icon={Droplets}
                  label="Clean Water"
                  value={stats?.waterReachedPW || 0}
                  sub="people with access"
                  color="text-cyan-600"
                  bg="bg-cyan-50"
                />
                <StatCard
                  icon={TreePine}
                  label="Trees Planted"
                  value={stats?.treesPlantedGS || 0}
                  sub="across schools"
                  color="text-green-600"
                  bg="bg-green-50"
                />
                <StatCard
                  icon={Calendar}
                  label="Active Programmes"
                  value={stats?.activeProgrammes || 0}
                  sub="in this area"
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="reach">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Leaders Reach */}
            <ReachCard
              title="Student Leaders (SLF)"
              icon={GraduationCap}
              reached={stats?.totalLeaders || 0}
              target={targets.students.yearlyTarget}
              total={targets.students.total}
              percentage={studentReach}
              color="text-blue-600"
              bg="bg-blue-50"
              border="border-blue-200"
            />

            {/* Schools Reach */}
            <ReachCard
              title="School Partnerships"
              icon={Building2}
              reached={stats?.totalSchools || 0}
              target={targets.schools.partnerTarget}
              total={targets.schools.total}
              percentage={schoolReach}
              color="text-teal-600"
              bg="bg-teal-50"
              border="border-teal-200"
            />

            {/* Water Reach */}
            <ReachCard
              title="Clean Water Interventions"
              icon={Droplets}
              reached={stats?.waterReachedPW || 0}
              target={targets.water.targetInterventions}
              total={targets.water.populationWithoutAccess}
              percentage={waterReach}
              color="text-cyan-600"
              bg="bg-cyan-50"
              border="border-cyan-200"
            />

            {/* Girls Reach */}
            <ReachCard
              title="Girls with MHM Support (RED)"
              icon={Heart}
              reached={stats?.girlsReachedRED || 0}
              target={Math.round(targets.menstrualHealth.schoolGirls * 0.3)}
              total={targets.menstrualHealth.schoolGirls}
              percentage={Math.round((stats?.girlsReachedRED || 0) / (targets.menstrualHealth.schoolGirls * 0.3) * 100)}
              color="text-pink-600"
              bg="bg-pink-50"
              border="border-pink-200"
            />
          </div>
        </TabsContent>

        <TabsContent value="gaps">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Service Access Gaps
              </CardTitle>
              <CardDescription>
                Based on UBOS 2024 Census data for {district}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Gap bars */}
              <div className="space-y-4">
                <GapBar
                  label="Without Clean Water"
                  gap={100 - waterAccess}
                  color="bg-cyan-500"
                />
                <GapBar
                  label="Girls Needing MHM Support"
                  gap={Math.round(teenPregnancy * 1.5)}
                  color="bg-pink-500"
                />
                <GapBar
                  label="Vulnerable Youth"
                  gap={20}
                  color="bg-purple-500"
                />
                <GapBar
                  label="Schools Without Partnership"
                  gap={100 - schoolReach}
                  color="bg-blue-500"
                />
              </div>

              {/* Context */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="font-bold text-sm text-amber-800">Teenage Pregnancy Context</p>
                <p className="text-xs text-amber-700 mt-1">
                  {teenPregnancy}% of girls aged 15-19 in {district} have begun childbearing (UBOS).
                  Your RED Campaign menstrual health support is critical for keeping girls in school.
                </p>
              </div>

              {/* Population stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-2xl font-black">{stats_ug.population.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Population</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-2xl font-black">{stats_ug.youthPopulation.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Youth (15-24)</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-2xl font-black">{Math.round(waterAccess / 100 * stats_ug.population).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">With Water Access</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-2xl font-black">{targets.water.populationWithoutAccess.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Without Water</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <MapPin className="h-5 w-5 text-primary" />
                Subcounties in {district}
              </CardTitle>
              <CardDescription>
                {subcounties.length} subcounties • {districtData?.population?.toLocaleString()} total population
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcounties.map((sc: any) => {
                  const scLocations = locations.filter(l => l.subcounty === sc.name);
                  const scSchools = scLocations.filter((l: any) => l.type === 'school').length;
                  
                  return (
                    <button
                      key={sc.name}
                      onClick={() => onFilterChange?.({ ...filters, subcounty: sc.name })}
                      className="text-left p-4 rounded-xl border border-muted hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <p className="font-bold text-sm">{sc.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sc.parishes.length} parishes • {scSchools} schools mapped
                      </p>
                      {scLocations.length > 0 && (
                        <Progress 
                          value={(scSchools / Math.max(scLocations.length, 1)) * 100} 
                          className="h-1 mt-2" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: any;
  label: string;
  value: number;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-lg shadow-comic-sm">
      <CardContent className="p-4">
        <div className={`inline-flex items-center justify-center p-2 rounded-xl ${bg} mb-2`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-2xl font-black">{value.toLocaleString()}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ReachCard({ title, icon: Icon, reached, target, total, percentage, color, bg, border }: {
  title: string;
  icon: any;
  reached: number;
  target: number;
  total: number;
  percentage: number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <Card className={`border-lg shadow-comic-sm ${border}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Reached</span>
            <span className="text-xs font-bold">{reached.toLocaleString()}</span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% of target</span>
            <span>Goal: {target.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total opportunity</span>
            <span className="font-bold">{total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((reached / total) * 100)}% of total population reached
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function GapBar({ label, gap, color }: { label: string; gap: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{gap}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${gap}%` }} />
      </div>
    </div>
  );
}

// Missing import for X icon
function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
