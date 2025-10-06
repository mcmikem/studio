'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyPriorities } from './my-priorities';
import { TeamToday } from './team-today';
import { RecentCheckouts } from './recent-checkouts';
import { ClipboardList, Users, MessageSquareText } from 'lucide-react';

export function TeamActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Pulse</CardTitle>
        <CardDescription>
          Priorities, check-ins, and live activity from the team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">
                <MessageSquareText className="mr-2 h-4 w-4" />
                Activity Feed
            </TabsTrigger>
            <TabsTrigger value="priorities">
                <ClipboardList className="mr-2 h-4 w-4" />
                My Priorities
            </TabsTrigger>
            <TabsTrigger value="team">
                <Users className="mr-2 h-4 w-4" />
                Team Status
            </TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="pt-6">
            <RecentCheckouts />
          </TabsContent>
          <TabsContent value="priorities" className="pt-6">
            <MyPriorities />
          </TabsContent>
           <TabsContent value="team" className="pt-6">
            <TeamToday />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
