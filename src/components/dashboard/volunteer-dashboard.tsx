
'use client';

import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, Users, Heart, Calendar, 
  Clock, Star, PlayCircle, Video, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { DashboardSection, CompactStatCard } from './dashboard-section';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import { differenceInHours, startOfWeek } from 'date-fns';
import { CheckinWidget } from './checkin-widget';

const QUICK_ACTIONS = [
  { href: '/school-xperience/log-visit', icon: ClipboardCheck, label: 'Log Visit', color: 'bg-blue-500', sub: 'Record school visit' },
  { href: '/school-xperience/submit-scorecard', icon: Users, label: 'Scorecard', color: 'bg-purple-500', sub: 'Rate school' },
  { href: '/meal/beneficiary-registration', icon: Heart, label: 'Register', color: 'bg-pink-500', sub: 'Beneficiary' },
  { href: '/meal/activity', icon: Calendar, label: 'Log Activity', color: 'bg-green-500', sub: 'Programme' },
  { href: '/record-testimony', icon: Video, label: 'Story', color: 'bg-amber-500', sub: 'Capture story' },
];

export function VolunteerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const userId = profile.id;

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const checkinsQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(weekStart)),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [firestore, userId, weekStart]);

  const checkoutsQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'checkouts'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(weekStart)),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [firestore, userId, weekStart]);

  const activitiesQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'activities'),
      where('userId', '==', userId),
      orderBy('loggedAt', 'desc'),
      limit(20)
    );
  }, [firestore, userId]);

  const { data: checkins } = useCollection(checkinsQuery);
  const { data: checkouts } = useCollection(checkoutsQuery);
  const { data: activities } = useCollection(activitiesQuery);

  const stats = useMemo(() => {
    const totalHours = (checkins || []).reduce((sum, c) => {
      const checkinTime = c.timestamp?.toDate?.();
      if (!checkinTime) return sum;
      const matchingCheckout = (checkouts || []).find(co => {
        const coTime = co.timestamp?.toDate?.();
        return coTime && coTime > checkinTime;
      });
      if (matchingCheckout) {
        const coTime = matchingCheckout.timestamp?.toDate?.();
        return sum + Math.max(0, differenceInHours(coTime!, checkinTime));
      }
      return sum + 8;
    }, 0);

    const activitiesThisWeek = (activities || []).filter(a => {
      const loggedAt = a.loggedAt?.toDate?.();
      return loggedAt && loggedAt >= weekStart;
    }).length;

    const impactPoints = (activities || []).reduce((sum, a) => {
      return sum + (a.totalValue || 0);
    }, 0);

    return {
      hours: Math.round(totalHours),
      activities: activitiesThisWeek || (activities?.length || 0),
      impactPoints,
    };
  }, [checkins, checkouts, activities, weekStart]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />

      {/* Check-in Status */}
      <CheckinWidget />

      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-omuto-navy to-omuto-navy/80 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Welcome, {profile.name?.split(' ')[0]}!</p>
              <p className="text-xs opacity-80">Make an impact today</p>
            </div>
            <Star className="h-6 w-6 text-omuto-yellow" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Main Focus */}
      <DashboardSection title="What would you like to do?" icon={PlayCircle} defaultOpen={true}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                className={`h-auto py-3 rounded-xl flex-col gap-1 shadow-md hover:-translate-y-0.5 ${action.color} text-white`}
              >
                <Link href={action.href}>
                  <Icon className="h-5 w-5" />
                  <span className="font-black text-[10px] uppercase">{action.label}</span>
                  <span className="text-[9px] opacity-75">{action.sub}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </DashboardSection>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-black">{stats.hours}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Hours This Week</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <ClipboardCheck className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-black">{stats.activities}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Activities Done</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <Heart className="h-5 w-5 mx-auto text-pink-500 mb-1" />
            <p className="text-xl font-black">{stats.impactPoints}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Impact Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      {activities && activities.length > 0 && (
        <DashboardSection title="Recent Activities" icon={Calendar} defaultOpen={false}>
          <div className="space-y-2">
            {activities.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.ecosystem_phase || 'Activity'}</p>
                </div>
                {activity.totalValue > 0 && (
                  <span className="text-xs font-bold text-green-600">{activity.totalValue} pts</span>
                )}
              </div>
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
