
'use client';

import { useEffect, useState, useMemo } from 'react';
import { generateSmartRemindersAction as runSmartReminders } from '@/actions/mutations';
import type { SmartRemindersOutput } from '@/lib/types';
import type { User } from '@/lib/types';
import { Loader2, Wand } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        setReminders(result);
      } catch (error: any) {
        console.error('Failed to fetch smart reminders:', error);
        setError("Could not load reminders at this time.");
        setReminders(null); // Clear reminders on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchReminders();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Computing your personal reminders...
      </div>
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
