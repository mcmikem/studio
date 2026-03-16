'use client';

import { useEffect } from 'react';
import { useCheckinReminder } from '@/hooks/use-checkin-reminder';

export function CheckinReminderToast() {
  const { reminderState, showReminder, refreshStatus } = useCheckinReminder();

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshStatus();
    }, 3000);

    return () => clearTimeout(timer);
  }, [refreshStatus]);

  useEffect(() => {
    if (reminderState.shouldShow) {
      const shownKey = `reminder_shown_${reminderState.type}_${new Date().toDateString()}`;
      const hasShown = sessionStorage.getItem(shownKey);
      
      if (!hasShown) {
        showReminder();
        sessionStorage.setItem(shownKey, 'true');
      }
    }
  }, [reminderState, showReminder]);

  return null;
}
