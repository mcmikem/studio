'use client';

import { useMemo } from 'react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Button } from '../ui/button';

export function MyTasksSummary() {
  const { user } = useUser();

  const tasksQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'tasks'),
      where('completed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [user]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  return (
    <Card className="hover:bg-muted/50 transition-colors group/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            My Pending Tasks
          </CardTitle>
          <CardDescription>Your most important to-do items.</CardDescription>
        </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-2/3" />
          </>
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
              <span>{task.title}</span>
            </div>
          ))
        ) : (
            <EmptyState
              icon={CheckCircle}
              title="No Pending Tasks"
              description="You're all caught up! Add a new task in your profile."
              className="min-h-0 py-4"
            />
        )}
      </CardContent>
      <CardFooter>
          <Button asChild className="w-full" variant="ghost">
              <Link href="/profile?tab=tasks" className="text-sm text-primary group-hover/card:underline flex items-center justify-end w-full">
                  Manage all my tasks <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
