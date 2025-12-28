
'use client';

import { useMemo } from 'react';
import type { User } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { UserCheck } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface SupervisorCardProps {
  profile: User;
}

export function SupervisorCard({ profile }: SupervisorCardProps) {
  const firestore = useFirestore();

  const supervisorId = profile.supervisorId || 'mcmike@omuto.org';

  const supervisorDocRef = useMemoFirebase(() => {
    if (!firestore || !supervisorId) return null;
    // Note: We're assuming the supervisorId is the user's document ID.
    // If it's an email, we'd need a query.
    return doc(firestore, 'users', supervisorId);
  }, [firestore, supervisorId]);

  const { data: supervisor, isLoading } = useDoc<User>(supervisorDocRef);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserCheck /> Your Supervisor</CardTitle>
        <CardDescription>Your primary point of contact for guidance and support.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
        )}
        {supervisor && (
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary" data-ai-hint="person avatar">
                    <AvatarImage src={supervisor.photoURL} alt={supervisor.name} />
                    <AvatarFallback className="text-xl">{getInitials(supervisor.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-bold">{supervisor.name}</p>
                    <p className="text-muted-foreground">{supervisor.role}</p>
                    <a href={`mailto:${supervisor.email}`} className="text-sm text-primary hover:underline">{supervisor.email}</a>
                </div>
            </div>
        )}
        {!isLoading && !supervisor && (
            <p className="text-sm text-muted-foreground">Your supervisor has not been assigned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
