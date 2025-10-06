'use client';

import type { User } from '@/lib/types';
import { ProgramsOverview } from './programs-overview';
import { TeamActivityFeed } from './team-activity-feed';
import { DashboardCalendar } from './dashboard-calendar';
import { ImpactOverview } from './impact-overview';
import { PartnershipsOverview } from './partnerships-overview';
import { DailyActions } from './daily-actions';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export function ProgramManagerDashboard({ profile }: { profile: User }) {
    const firstName = profile?.name?.split(' ')[0] || 'User';

    return (
        <>
            <header className="space-y-1">
                <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
                    {getGreeting()},{' '}
                    {firstName} 🚀 |
                    Program Manager View
                </h1>
                <p className="text-sm text-muted-foreground">
                    {dateString} | Mpigi District, Uganda (EAT)
                </p>
            </header>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <ImpactOverview />
                </div>
                <div className="lg:col-span-2">
                    <ProgramsOverview />
                </div>
                <div className="lg:col-span-2">
                    <TeamActivityFeed />
                </div>
                 <div className="lg:col-span-1">
                    <DailyActions />
                </div>
                <div className="lg:col-span-1">
                    <PartnershipsOverview />
                </div>
                 <div className="lg:col-span-2">
                    <DashboardCalendar />
                </div>
            </div>
        </>
    )
}
