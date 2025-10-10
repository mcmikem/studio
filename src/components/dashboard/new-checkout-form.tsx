
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { useUserProfile } from '@/hooks/use-user-profile';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function NewCheckoutForm() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1')?.imageUrl;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !user || !firestore || !profile) return;

    setLoading(true);

    const checkoutData = {
      name: profile.name,
      role: profile.role, 
      avatar: user.photoURL || userAvatar || '',
      task: task,
      timestamp: serverTimestamp(),
      userId: user.uid,
    };
    
    const checkoutsCollection = collection(firestore, 'checkouts');

    addDocumentNonBlocking(checkoutsCollection, checkoutData);
    
    toast({
        title: "Check-out posted!",
        description: "Your update has been shared with the team.",
    });

    setTask('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <Label htmlFor="task-update" className="sr-only">What did you achieve?</Label>
        <Textarea
            id="task-update"
            placeholder="e.g., Finalized RED Campaign proposal and met with 2 new potential partners. #Fundraising #Partnerships"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            required
            className="min-h-[80px]"
        />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !task.trim()}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        🏁 Check Out & Post Update
        </Button>
    </form>
  );
}
