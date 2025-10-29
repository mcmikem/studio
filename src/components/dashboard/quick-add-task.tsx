'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QuickAddTask() {
  const [taskTitle, setTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user || !firestore) {
      return;
    }

    setIsLoading(true);
    
    const tasksCollection = collection(firestore, 'users', user.uid, 'tasks');
    const newTask = {
      title: taskTitle,
      completed: false,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(tasksCollection, newTask);
      toast({
        title: 'Task Added!',
        description: `"${taskTitle}" has been added to your list.`,
      });
      setTaskTitle('');
    } catch (error) {
      console.error("Failed to add task:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Quick Add Task</CardTitle>
        <CardDescription>Jot down a to-do item for later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className="flex items-center gap-2">
          <Input
            placeholder="e.g., Follow up with Jane from UNICEF"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={isLoading}
            className="bg-background"
          />
          <Button type="submit" size="icon" disabled={isLoading || !taskTitle.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
