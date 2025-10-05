'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Notifications
        </h1>
        <p className="text-muted-foreground">
          All your alerts and updates in one place.
        </p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
                The unified notification center is currently under development.
            </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <Bell className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">All important notifications will appear here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
