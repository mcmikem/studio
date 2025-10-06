
'use client';

import type { User } from '@/lib/types';
import { ProgramsOverview } from './programs-overview';
import { TeamActivityFeed } from './team-activity-feed';
import { Alerts } from './alerts';

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
             <div className="space-y-6">
                 <p>Welcome to the Program Manager Dashboard. This view will contain "Program Health", "Team Coordination", and "Partnership Pipeline".</p>
                <ProgramsOverview />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <TeamActivityFeed />
                    </div>
                    <div>
                        <Alerts />
                    </div>
                </div>
            </div>
        </>
    )
}
