'use client';

import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

// Sample tasks to pre-populate for the demo user
const sampleTasks = [
  { title: 'Approve October budget - Due Today', completed: false, dueDate: '2025-10-25' },
  { title: 'Review Omuto Pulse script - Due Oct 27', completed: false, dueDate: '2025-10-27' },
  { title: 'Call with Mr. Akera (Resource Mobilization) - Due Oct 28', completed: true, dueDate: '2025-10-28' },
];

export function MyPriorities() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);

  // Memoize the query to prevent re-renders
  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      where('completed', '==', false)
    );
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);
  
  // Effect to seed sample tasks for the current user if they don't have any
  useEffect(() => {
    if (user && firestore && tasks === null && !isLoading && !isSeeding) {
        const hasTasks = localStorage.getItem(`tasks_seeded_${user.uid}`);
        if (!hasTasks) {
            setIsSeeding(true);
            const batch = writeBatch(firestore);
            const tasksCollection = collection(firestore, 'users', user.uid, 'tasks');
            sampleTasks.forEach(task => {
                const taskRef = doc(tasksCollection);
                batch.set(taskRef, task);
            });
            batch.commit().then(() => {
                localStorage.setItem(`tasks_seeded_${user.uid}`, 'true');
                setIsSeeding(false);
            }).catch(console.error);
        }
    }
  }, [user, firestore, tasks, isLoading, isSeeding]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          My Priorities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading || isSeeding ? (
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
        <Button variant="link" className="p-0 h-auto" asChild>
            <Link href="/profile">View all tasks</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
