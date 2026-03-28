
'use client';

import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, Users, Heart, Calendar, MapPin, 
  Clock, Star, Bell, PlayCircle, Video
} from 'lucide-react';
import Link from 'next/link';
import { DashboardSection, CompactStatCard } from './dashboard-section';

const QUICK_ACTIONS = [
  { href: '/school-xperience/log-visit', icon: ClipboardCheck, label: 'Log Visit', color: 'bg-blue-500', sub: 'Record school visit' },
  { href: '/school-xperience/submit-scorecard', icon: Users, label: 'Scorecard', color: 'bg-purple-500', sub: 'Rate school' },
  { href: '/meal/beneficiary-registration', icon: Heart, label: 'Register', color: 'bg-pink-500', sub: 'Beneficiary' },
  { href: '/meal/activity', icon: Calendar, label: 'Log Activity', color: 'bg-green-500', sub: 'Programme' },
  { href: '/record-testimony', icon: Video, label: 'Story', color: 'bg-amber-500', sub: 'Capture story' },
];

export function VolunteerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />

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

      {/* Today's Focus */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-black">-</p>
            <p className="text-[10px] uppercase text-muted-foreground">Hours This Week</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <ClipboardCheck className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-black">-</p>
            <p className="text-[10px] uppercase text-muted-foreground">Activities Done</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <Heart className="h-5 w-5 mx-auto text-pink-500 mb-1" />
            <p className="text-xl font-black">-</p>
            <p className="text-[10px] uppercase text-muted-foreground">Impact Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Activities */}
      <DashboardSection title="Upcoming" icon={Calendar} defaultOpen={false}>
        <p className="text-sm text-muted-foreground text-center py-4">No upcoming activities scheduled.</p>
      </DashboardSection>
    </div>
  );
}
