
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

export function MyPriorities() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      where('completed', '==', false),
      orderBy('createdAt', 'asc'),
      limit(3)
    );
  }, [user, firestore]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);
  
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <Link href="/profile?tab=tasks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              My Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-2/3" />
              </>
            ) : tasks && tasks.length > 0 ? (
              tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
                  <span>{task.title}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No pending tasks. Great job!</p>
            )}
            <p className="text-xs text-primary pt-2">View all tasks →</p>
          </CardContent>
      </Link>
    </Card>
  );
}
