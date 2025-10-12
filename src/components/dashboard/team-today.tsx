
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
import type { User, Checkin } from '@/lib/types';
import { useMemo } from 'react';
import { differenceInHours } from 'date-fns';

export function TeamToday() {
  const firestore = useFirestore();
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

  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  const teamStatus = useMemo(() => {
      if (!users || !checkins) return [];
      const now = new Date();
      return users.map(user => {
          const userCheckin = checkins.find(c => c.userId === user.id);
          if (userCheckin) {
              const hoursSinceCheckin = differenceInHours(now, userCheckin.timestamp.toDate());
              if (hoursSinceCheckin < 4) {
                  return { ...user, status: 'Online' as const };
              } else if (hoursSinceCheckin < 8) {
                  return { ...user, status: 'Away' as const };
              }
          }
          return { ...user, status: 'Offline' as const };
      });
  }, [users, checkins]);

  const isLoading = isLoadingUsers || isLoadingCheckins;

  const statusConfig = {
      Online: { icon: UserCheck, color: 'text-green-500' },
      Away: { icon: Clock, color: 'text-yellow-500' },
      Offline: { icon: UserX, color: 'text-red-500' },
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
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          : teamStatus && teamStatus.length > 0 ? (
              teamStatus.map((member) => {
                const { icon: Icon, color } = statusConfig[member.status];
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <Icon className={`flex h-4 w-4 flex-shrink-0 ${color}`} />
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-muted-foreground truncate">({member.role})</p>
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
