'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { startOfDay, addHours, isBefore, isAfter, getHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export type ReminderType = 'checkin' | 'checkout' | 'none';

interface ReminderState {
  type: ReminderType;
  message: string;
  shouldShow: boolean;
}

const CHECKIN_START_HOUR = 6;
const CHECKIN_END_HOUR = 10;
const CHECKOUT_START_HOUR = 15;
const CHECKOUT_END_HOUR = 19;
const MAX_WORK_HOURS = 10;

export function useCheckinReminder() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [reminderState, setReminderState] = useState<ReminderState>({ type: 'none', message: '', shouldShow: false });
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [checkinTime, setCheckinTime] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user || !firestore) return;

    const now = new Date();
    const todayStart = startOfDay(now);
    const currentHour = getHours(now);

    try {
      const checkinsRef = collection(firestore, 'checkins');
      const checkinsQ = query(
        checkinsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(todayStart))
      );
      const checkinsSnap = await getDocs(checkinsQ);
      
      const checkoutsRef = collection(firestore, 'checkouts');
      const checkoutsQ = query(
        checkoutsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(todayStart))
      );
      const checkoutsSnap = await getDocs(checkoutsQ);

      const hasCheckin = !checkinsSnap.empty;
      const hasCheckout = !checkoutsSnap.empty;

      setHasCheckedToday(hasCheckin);
      setCheckedOutToday(hasCheckout);

      let checkinDate: Date | null = null;
      if (hasCheckin) {
        const checkinDoc = checkinsSnap.docs[0];
        const timestamp = checkinDoc.data().timestamp;
        if (timestamp?.toDate) {
          checkinDate = timestamp.toDate();
          setCheckinTime(checkinDate);
        }
      }

      let newState: ReminderState = { type: 'none', message: '', shouldShow: false };

      if (!hasCheckin) {
        if (currentHour >= CHECKIN_START_HOUR && currentHour < CHECKIN_END_HOUR) {
          newState = {
            type: 'checkin',
            message: 'Good morning! Time to check in and start your day.',
            shouldShow: true,
          };
        } else if (currentHour >= CHECKIN_END_HOUR) {
          newState = {
            type: 'checkin',
            message: 'You haven\'t checked in yet today. Start your day now!',
            shouldShow: true,
          };
        }
      } else if (hasCheckin && !hasCheckout) {
        const expectedCheckoutTime = checkinDate ? addHours(checkinDate, MAX_WORK_HOURS) : addHours(now, MAX_WORK_HOURS - (currentHour - CHECKIN_START_HOUR));
        
        if (currentHour >= CHECKOUT_START_HOUR && currentHour < CHECKOUT_END_HOUR) {
          newState = {
            type: 'checkout',
            message: 'It\'s getting late! Remember to checkout when you\'re done.',
            shouldShow: true,
          };
        } else if (isAfter(now, expectedCheckoutTime)) {
          newState = {
            type: 'checkout',
            message: 'You\'ve been working for a while. Time to checkout!',
            shouldShow: true,
          };
        }
      }

      setReminderState(newState);
    } catch (error) {
      console.error('Error checking reminder status:', error);
    }
  }, [user, firestore]);

  useEffect(() => {
    checkStatus();
    
    const interval = setInterval(checkStatus, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  const showReminder = useCallback(() => {
    if (reminderState.shouldShow && reminderState.type !== 'none') {
      toast({
        title: reminderState.type === 'checkin' ? '⏰ Check-in Reminder' : '📝 Checkout Reminder',
        description: reminderState.message,
        duration: 10000,
      });
    }
  }, [reminderState, toast]);

  return {
    reminderState,
    hasCheckedToday,
    checkedOutToday,
    checkinTime,
    showReminder,
    refreshStatus: checkStatus,
  };
}
