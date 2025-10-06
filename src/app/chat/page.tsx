'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, Slack, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Chat & Team Space
        </h1>
        <p className="text-muted-foreground">
          Real-time communication and collaboration for the Omuto team.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Integrated Chat: Feature in Planning</CardTitle>
          <CardDescription>
            A built-in team chat feature is on our roadmap for a future version of Omuto Central.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Continuing Communication on Existing Channels
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              For now, please continue to use our existing communication tools for real-time team collaboration and announcements.
            </p>
            <div className="mt-6 flex gap-4">
                 <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span>Team WhatsApp</span>
                </a>
                 <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Slack className="h-5 w-5" />
                    <span>Slack Channel</span>
                </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
