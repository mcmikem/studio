
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
} from 'firebase/firestore';
import type { Task } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { formatDateSafe } from '@/lib/utils';
import { serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters.'),
  dueDate: z.string().optional(),
});

function NewTaskForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    if (!user || !firestore) return;

    const tasksCollection = collection(firestore, 'users', user.uid, 'tasks');
    const newTask = {
      ...data,
      completed: false,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(tasksCollection, newTask);
    toast({
      title: 'Task Added!',
    });
    reset({ title: '', dueDate: '' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
      <div className="flex-grow space-y-1">
        <Input {...register('title')} placeholder="Add a new task..." />
        {errors.title && (
          <p className="text-sm text-destructive">{`${errors.title.message}`}</p>
        )}
      </div>
      <div className="space-y-1">
         <Input {...register('dueDate')} type="date" />
      </div>
      <Button type="submit" disabled={isSubmitting} size="icon">
        {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
      </Button>
    </form>
  );
}

export function UserTasks() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Simplified query: Only order by creation date. Filtering will be done on the client.
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (!user || !firestore) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, { completed: completed });
    
    if (completed) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
  };

  // Client-side filtering
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending: Task[] = [];
    const completed: Task[] = [];
    if (tasks) {
      for (const task of tasks) {
        if (task.completed) {
          completed.push(task);
        } else {
          pending.push(task);
        }
      }
    }
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);


  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>My Personal Tasks</CardTitle>
        <CardDescription>
          Add, view, and manage all of your personal to-do items here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <NewTaskForm />

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">Pending Tasks</h3>
          <div className="space-y-2">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      handleTaskToggle(task.id, !!checked)
                    }
                  />
                  <label htmlFor={`task-${task.id}`} className="flex-grow text-sm cursor-pointer">
                    {task.title}
                  </label>
                  {task.dueDate && <Badge variant="outline">{formatDateSafe(task.dueDate, "dateOnly")}</Badge>}
                </div>
              ))
            ) : (
                !isLoading && <p className="text-sm text-muted-foreground p-2">No pending tasks. Well done!</p>
            )}
          </div>
        </div>

        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Completed Tasks</h3>
           <div className="space-y-2">
            {isLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-md">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      handleTaskToggle(task.id, !!checked)
                    }
                  />
                  <label htmlFor={`task-${task.id}`} className="flex-grow text-sm text-muted-foreground line-through cursor-pointer">
                    {task.title}
                  </label>
                </div>
              ))
            ) : (
                !isLoading && <p className="text-sm text-muted-foreground p-2">No tasks completed yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
