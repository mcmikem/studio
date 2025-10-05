'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { useUser } from '@/firebase';

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information, tasks, and check-in history.
        </p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
                The user profile page is currently under development.
            </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <User className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Your personal dashboard and settings will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
