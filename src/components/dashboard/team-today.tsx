'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Checkin } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

// Static list of all team members for now. In the future, this would come from the `users` collection.
const allTeamMembers = [
    { name: 'McMike', status: 'In Field', location: 'Nindye SS'},
    { name: 'Kasirye', status: 'Online', location: 'HQ' },
    { name: 'Dianah', status: 'In Meeting', location: 'Kampala' },
    { name: 'Bwire', status: 'Not Checked In', location: ''},
    { name: 'Alex', status: 'Not Checked In', location: ''},
    { name: 'Jimmy', status: 'Not Checked In', location: ''},
];

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

  const { data: checkins, isLoading } = useCollection<Checkin>(checkinsQuery);

  const teamStatus = useMemo(() => {
    if (isLoading) return allTeamMembers.map(t => ({ ...t, status: 'Loading' }));
    
    const checkedInUserIds = new Set(checkins?.map(c => c.userId));
    
    // This is a simplified logic. A real implementation would fetch user details.
    return allTeamMembers.map(member => {
        // A more robust system would match by user ID
        const hasCheckedIn = checkins?.some(c => c.name.includes(member.name));
        
        if (hasCheckedIn) {
            // Here you could add more detailed logic based on check-in data
             return { ...member, status: member.status === "Not Checked In" ? 'Online' : member.status };
        }
        return { ...member, status: 'Not Checked In' };
    });
  }, [checkins, isLoading]);

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
            Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))
        ) : (
          teamStatus.map((member) => (
            <div key={member.name} className="flex items-center gap-2">
              <span className={`flex h-3 w-3 rounded-full ${getStatusColor(member.status)}`}></span>
              <span>{member.name} ({member.status}{member.location ? ` - ${member.location}`: ''})</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
