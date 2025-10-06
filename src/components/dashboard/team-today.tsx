'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Checkin } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import type { User as UserProfile } from '@/lib/types';


const getStatusColor = (status: string) => {
    switch (status) {
        case 'Online':
        case 'In Field':
            return 'bg-green-500';
        case 'In Meeting':
            return 'bg-yellow-500';
        default:
            return 'bg-red-500';
    }
};

export function TeamToday() {
  const firestore = useFirestore();

  const startOfDay = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(now);
  }, []);

  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'checkins'),
        where('timestamp', '>=', startOfDay)
    );
  }, [firestore, startOfDay]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);

  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  const { data: allTeamMembers, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const teamStatus = useMemo(() => {
    const isLoading = isLoadingUsers || isLoadingCheckins;
    if (isLoading || !allTeamMembers) return Array.from({ length: 5 }).map((_, i) => ({ id: `${i}`, name: 'Loading...', status: 'Loading' }));
    
    const checkedInUserIds = new Set(checkins?.map(c => c.userId));
    
    return allTeamMembers.map(member => {
        const hasCheckedIn = checkedInUserIds.has(member.id);
        
        if (hasCheckedIn) {
             // In a future version, we could pull location/status from the checkin document
             return { id: member.id, name: member.name, status: 'Online' };
        }
        return { id: member.id, name: member.name, status: 'Not Checked In' };
    });
  }, [checkins, isLoadingCheckins, allTeamMembers, isLoadingUsers]);
  
  const isLoading = isLoadingUsers || isLoadingCheckins;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))
        ) : (
          teamStatus.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <span className={`flex h-3 w-3 rounded-full ${getStatusColor(member.status)}`}></span>
              <span>{member.name} ({member.status})</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
