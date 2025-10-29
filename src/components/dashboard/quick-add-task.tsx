
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
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
    <form onSubmit={handleAddTask} className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Add a to-do item..."
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" size="icon" disabled={isLoading || !taskTitle.trim()}>
         {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
      </Button>
    </form>
  );
}
