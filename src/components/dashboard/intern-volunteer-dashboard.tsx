
'use client';

import type { User } from '@/lib/types';
import { DashboardGrid } from './dashboard-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { MessageSquare, User as UserIcon, Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function MySupervisorCard() {
    // This is hardcoded for now, but could be fetched from a user's profile
    const supervisor = {
        name: 'Kasirye Constantine',
        role: 'Operations & Field Manager',
        avatar: '', // Add a placeholder if available
    }

     const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
            return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Supervisor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={supervisor.avatar} />
                        <AvatarFallback>{getInitials(supervisor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{supervisor.name}</p>
                        <p className="text-sm text-muted-foreground">{supervisor.role}</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask a Question
                    </Button>
                     <Button variant="outline" className="w-full" asChild>
                        <Link href="/profile">
                            <UserIcon className="mr-2 h-4 w-4" />
                            View Profile
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

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
  )
}

interface DashboardProps {
  profile: User;
}

export function InternVolunteerDashboard({ profile }: DashboardProps) {

  return (
      <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-1 flex flex-col gap-6">
            <MySupervisorCard />
            <QuickActionsCard />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Future components like "My Current Task" or "My Impact" can go here */}
            <Card className="min-h-96">
                <CardHeader>
                    <CardTitle>My Tasks &amp; Impact</CardTitle>
                    <CardDescription>Coming Soon: A view of your assigned tasks and the impact you're making.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      </DashboardGrid>
  )
}
