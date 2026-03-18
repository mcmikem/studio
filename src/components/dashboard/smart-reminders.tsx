
'use client';

import { useEffect, useState, useMemo } from 'react';
import { generateSmartRemindersAction as runSmartReminders } from '@/actions/mutations';
import type { SmartRemindersOutput } from '@/lib/types';
import type { User } from '@/lib/types';
import { Loader2, Wand } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function SmartReminders({ profile }: { profile: User }) {
  const [reminders, setReminders] = useState<SmartRemindersOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function fetchReminders() {
      if (!profile) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await runSmartReminders({
          userName: profile.name,
          userRole: profile.role,
          userId: profile.id,
        });
        if (result && result.reminders) {
          setReminders(result);
        } else {
          setReminders(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch smart reminders:', error);
        setError("Could not load reminders at this time.");
        setReminders(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReminders();
  }, [profile]);

  if (isLoading) {
    return (
      <Alert className="border-accent/50 bg-accent/5">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </Alert>
    );
  }

  if (error) {
    // Fail silently in production, but you could show an error if desired
    // return (
    //   <Alert variant="destructive">
    //     <AlertTitle>Error</AlertTitle>
    //     <AlertDescription>{error}</AlertDescription>
    //   </Alert>
    // )
    return null;
  }

  if (!reminders || reminders.reminders.length === 0) {
    return null; // Don't show anything if there are no reminders
  }

  return (
    <Alert className="border-accent/50 bg-accent/5 text-accent-foreground">
        <Wand className="h-4 w-4 !text-accent" />
        <AlertTitle>Your Smart Reminders</AlertTitle>
        <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
                {reminders.reminders.map((r, i) => (
                    <li key={i}>{r}</li>
                ))}
            </ul>
        </AlertDescription>
    </Alert>
  );
}
