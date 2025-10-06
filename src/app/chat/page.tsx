'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Chat & Team Space
        </h1>
        <p className="text-muted-foreground">
          Real-time communication and collaboration for the Omuto team.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The integrated team chat feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Unified Team Communication
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              A dedicated space for real-time team chat, project channels, and
              direct messaging will be available here. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
