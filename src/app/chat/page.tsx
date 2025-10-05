'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">A dedicated space for team chat will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
