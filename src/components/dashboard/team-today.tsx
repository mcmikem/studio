
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { User, Checkin, Activity } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { differenceInHours } from 'date-fns';

export function TeamToday() {
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const checkinsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(todayStart)));
  }, [firestore]);
  
  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(todayStart)), orderBy('loggedAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);

  const teamStatus = useMemo(() => {
      if (!users || !checkins || !activities) return [];
      const now = currentTime;
      const isPast10AM = now.getHours() >= 10;

      return users.map(user => {
          const userCheckin = checkins.find(c => c.userId === user.id);
          const lastActivity = activities.find(a => a.userId === user.id);
          
          let status: 'Online' | 'Away' | 'Offline' | 'Not Checked In' = 'Offline';
          
          if (userCheckin) {
              const hoursSinceCheckin = differenceInHours(now, userCheckin.timestamp.toDate());
              if (hoursSinceCheckin < 4) {
                  status = 'Online';
              } else {
                  status = 'Away';
              }
          } else if (isPast10AM) {
              status = 'Not Checked In';
          }
          
          return { 
              ...user, 
              status,
              lastActivity: lastActivity?.title || null
          };
      });
  }, [users, checkins, activities, currentTime]);

  const isLoading = isLoadingUsers || isLoadingCheckins || isLoadingActivities;

  const statusConfig = {
      Online: { icon: UserCheck, color: 'text-green-500', label: 'Online' },
      Away: { icon: Clock, color: 'text-yellow-500', label: 'Away' },
      Offline: { icon: UserX, color: 'text-muted-foreground', label: 'Offline' },
      'Not Checked In': { icon: UserX, color: 'text-red-500', label: 'Not Checked In' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Status
        </CardTitle>
        <CardDescription>Live check-in status for today.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          : teamStatus && teamStatus.length > 0 ? (
              teamStatus.map((member) => {
                const { icon: Icon, color, label } = statusConfig[member.status];
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <Icon className={`flex h-4 w-4 flex-shrink-0 ${color}`} />
                    <div className="flex-grow truncate">
                        <p className="font-semibold truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                           {member.status === 'Not Checked In' 
                                ? <span className="text-red-500 font-medium">({label})</span>
                                : member.lastActivity ? `Last: ${member.lastActivity}` : `(${member.role})`
                            }
                        </p>
                    </div>
                  </div>
                );
              })
          ) : (
             <div className="text-center text-muted-foreground py-4">
                <p>No users found in the directory.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
