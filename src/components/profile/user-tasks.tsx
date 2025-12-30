
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, ListTodo, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';


export function UserTasks({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const tasksQuery = useMemoFirebase(() => {
      if (!firestore || !userId) return null;
      return query(
          collection(firestore, 'users', userId, 'tasks'),
          orderBy('createdAt', 'desc')
      );
  }, [firestore, userId]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !firestore || !user) return;

    setIsAdding(true);
    const tasksCollection = collection(firestore, 'users', user.uid, 'tasks');
    
    // Casting to any to avoid FieldValue/Timestamp type conflict in UI
    const newTask: any = {
      title: newTaskTitle,
      completed: false,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(tasksCollection, newTask);
      setNewTaskTitle('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!firestore || !user) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', task.id);
    await updateDocumentNonBlocking(taskRef, { completed: !task.completed });
  };

  const deleteTask = async (taskId: string) => {
    if (!firestore || !user) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
    await deleteDocumentNonBlocking(taskRef);
  };

  const isOwnProfile = user?.uid === userId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Tasks &amp; To-Dos
        </CardTitle>
        <CardDescription>Personal task management.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwnProfile && (
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={isAdding}
            />
            <Button type="submit" size="icon" disabled={isAdding || !newTaskTitle.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        )}

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task)}
                    disabled={!isOwnProfile}
                  />
                  <div className="grid gap-0.5">
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        Added {formatDateSafe(task.createdAt)}
                    </span>
                  </div>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={ListTodo}
              title="No tasks yet"
              description={isOwnProfile ? "Start by adding your first task above." : "This user hasn't added any tasks yet."}
              className="min-h-0 py-8"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
