
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';

export function TeamToday() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Directory
        </CardTitle>
        <CardDescription>A quick look at the core team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          : users && users.length > 0 ? (
              users.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <UserCheck
                  className={`flex h-4 w-4 flex-shrink-0 text-green-500`}
                />
                <p className="font-semibold">{member.name}</p>
                 <p className="text-muted-foreground truncate">({member.role})</p>
              </div>
            ))
          ) : (
             <div className="text-center text-muted-foreground py-4">
                <p>No users found in the directory.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
