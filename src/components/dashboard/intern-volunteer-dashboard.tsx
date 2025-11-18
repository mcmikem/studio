
'use client';

import type { User } from '@/lib/types';
import { DashboardGrid } from './dashboard-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { SmartReminders } from './smart-reminders';

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button size="lg" asChild>
          <Link href="/forms/activity">
            <Clock className="mr-2 h-4 w-4" /> Log My Hours
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/forms/volunteer-note">
            <MessageCircle className="mr-2 h-4 w-4" /> Submit End-of-Day Note
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface DashboardProps {
  profile: User;
}

export function InternVolunteerDashboard({ profile }: DashboardProps) {
  return (
    <DashboardGrid className="mt-6 lg:grid-cols-3">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <QuickActionsCard />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* The SmartReminders component provides contextual, AI-driven prompts */}
        <SmartReminders profile={profile} />
        <Card className="min-h-96">
          <CardHeader>
            <CardTitle>My Tasks &amp; Impact</CardTitle>
            <CardDescription>
              Coming Soon: A view of your assigned tasks and the impact you're
              making.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardGrid>
  );
}
