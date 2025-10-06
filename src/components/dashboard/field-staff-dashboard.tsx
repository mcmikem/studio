
'use client';

import type { User } from '@/lib/types';
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

export function FieldStaffDashboard({ profile }: { profile: User }) {
    const firstName = profile?.name?.split(' ')[0] || 'User';

    return (
        <>
            <header className="space-y-1">
                <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
                    {getGreeting()},{' '}
                    {firstName} 🚀 |
                    Field Operations View
                </h1>
                <p className="text-sm text-muted-foreground">
                    {dateString} | Mpigi District, Uganda (EAT)
                </p>
            </header>
             <div className="space-y-6">
                <p>Welcome to the Field Staff Dashboard. This view will contain "Today's Battle Plan", "Field Intelligence", and "Smart Reminders".</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Placeholder for "Today's Battle Plan" */}
                         <div className="p-8 border-2 border-dashed rounded-lg text-center">
                            Today's Battle Plan
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <DailyActions />
                         {/* Placeholder for "Field Intelligence" */}
                         <div className="p-8 border-2 border-dashed rounded-lg text-center">
                            Field Intelligence
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
