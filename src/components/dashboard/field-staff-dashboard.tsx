
'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { DashboardSection } from "./dashboard-section"
import dynamic from 'next/dynamic'
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, BarChart3, Plus, GraduationCap, Heart, Flower2, Droplets, Users, Calendar, Building2, Video, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { DashboardProps } from './dashboard-loader'
import { CheckinWidget } from './checkin-widget';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});

const QUICK_ACTIONS = [
  { href: '/school-xperience/log-visit', icon: ClipboardCheck, label: 'Log Visit', color: 'btn-omuto', sub: 'Record school visit' },
  { href: '/school-xperience/submit-scorecard', icon: GraduationCap, label: 'Scorecard', color: 'bg-blue-500 text-white hover:bg-blue-600', sub: 'Rate school performance' },
  { href: '/school-xperience/add-leader', icon: Users, label: 'Add Leader', color: 'bg-purple-500 text-white hover:bg-purple-600', sub: 'Register student leader' },
  { href: '/meal/beneficiary-registration', icon: Heart, label: 'Register', color: 'bg-pink-500 text-white hover:bg-pink-600', sub: 'Beneficiary registration' },
  { href: '/meal/activity', icon: BarChart3, label: 'Log Activity', color: 'bg-green-500 text-white hover:bg-green-600', sub: 'Record programme activity' },
  { href: '/meal/attendance', icon: Users, label: 'Attendance', color: 'bg-orange-500 text-white hover:bg-orange-600', sub: 'Take attendance' },
  { href: '/school-xperience/log-impact', icon: Flower2, label: 'Log Impact', color: 'bg-teal-500 text-white hover:bg-teal-600', sub: 'Trees, water, beneficiaries' },
  { href: '/record-testimony', icon: Video, label: 'Capture Story', color: 'bg-amber-500 text-white hover:bg-amber-600', sub: 'Record a story' },
];

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const visitsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'sx-visits'),
      where('visitorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: visits } = useCollection(visitsQuery);

  const recentSchools = useMemo(() => {
    if (!visits) return [];
    const seen = new Set<string>();
    return visits.filter((v) => {
      const key = v.schoolName ?? v.schoolId;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  }, [visits]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />
      
      {/* Check-in Status */}
      <CheckinWidget />
      
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="h-11 rounded-xl bg-omuto-cream/50 border border-omuto-navy/10 p-1 mb-2">
          <TabsTrigger
            value="quick"
            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger
            value="my-work"
            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            My Work
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-0 space-y-4">
          <div className="bg-omuto-cream/20 rounded-2xl border border-omuto-navy/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-omuto-red" />
              <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">What would you like to do?</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    asChild
                    className={`h-auto py-3 rounded-xl flex-col gap-1.5 shadow-md hover:-translate-y-0.5 transition-all ${action.color}`}
                  >
                    <Link href={action.href}>
                      <Icon className="h-5 w-5" />
                      <span className="font-black text-[10px] uppercase tracking-wider leading-tight">{action.label}</span>
                      <span className="text-[9px] opacity-75 font-medium leading-tight">{action.sub}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
          <DashboardSection
            title="Recently Visited Schools"
            description="Quick access to schools you've been working with"
            icon={Building2}
            defaultOpen={true}
          >
            {recentSchools.length > 0 ? (
              <div className="space-y-2">
                {recentSchools.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{visit.schoolName || 'School'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {visit.district || visit.subcounty || 'Location'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {visit.createdAt?.toDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(visit.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      )}
                      <Button asChild variant="ghost" size="sm" className="h-6 text-xs">
                        <Link href={`/school-xperience/log-visit?school=${visit.schoolId || visit.id}`}>Visit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Visit logs will appear here after your first visit.</p>
            )}
          </DashboardSection>
        </TabsContent>

        <TabsContent value="my-work" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MyWeeklyPlan />
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 space-y-4">
          <DashboardSection
            title="Team Deployment"
            description="Where your colleagues are working today"
            icon={Users}
            defaultOpen={true}
          >
            <TeamDeployment />
          </DashboardSection>
          <DashboardSection
            title="Performance"
            description="Your activity and rankings"
            icon={BarChart3}
            defaultOpen={false}
          >
            <TeamPerformanceLeaderboard />
          </DashboardSection>
        </TabsContent>
      </Tabs>
      <RoleMissionCard profile={profile} />
    </div>
  );
}
