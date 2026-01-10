'use client';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { SupervisorCard } from './supervisor-card';
import { DashboardHeader } from './dashboard-header';
import { SmartReminders } from './smart-reminders';
import { MyTasksSummary } from './my-tasks-summary';
import type { DashboardProps } from './dashboard-loader';

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Your most common daily tasks.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button size="lg" asChild>
          <Link href="/meal/activity">
            <BarChart3 className="mr-2 h-4 w-4" /> Log My Hours (Activity)
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/forms/check-out">
            <MessageCircle className="mr-2 h-4 w-4" /> Submit End-of-Day Note
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FirstQuestCard() {
    return (
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles /> Your First Quest!</CardTitle>
                <CardDescription>Get to know Omuto better by using your AI Coach.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="font-semibold mb-2">Your Mission:</p>
                <p className="mb-4">Go to the AI Coach and ask: <span className="italic font-medium">"What are the main programs at Omuto Foundation?"</span></p>
                <Button asChild>
                    <Link href="/chat">
                        Start Your Quest
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export function InternVolunteerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
       <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
           <SmartReminders profile={profile} />
           <MyTasksSummary />
        </div>
         <div className="flex flex-col gap-6">
            <QuickActionsCard />
            <SupervisorCard profile={profile} />
            <FirstQuestCard />
         </div>
    </DashboardGrid>
    </div>
  );
}
