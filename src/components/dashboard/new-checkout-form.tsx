'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// A mapping of user emails to their roles and avatar seeds
const userProfileMap: { [key: string]: { role: string, avatarSeed: string } } = {
    'mcmike@omuto.org': { role: 'ED', avatarSeed: 'mcmike' },
    'purity@omuto.org': { role: 'PPM', avatarSeed: 'purity' },
    'grace@omuto.org': { role: 'OPM', avatarSeed: 'grace' },
    'alex@omuto.org': { role: 'Media', avatarSeed: 'alex' },
    'jimmy@omuto.org': { role: 'Media', avatarSeed: 'jimmy' },
    'consultant@omuto.org': { role: 'FR', avatarSeed: 'consultant' },
};


export function NewCheckoutForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !user || !firestore) return;

    setLoading(true);

    const userEmail = user.email || 'default';
    const userProfile = userProfileMap[userEmail] || { role: 'User', avatarSeed: 'default' };

    const checkoutData = {
      name: user.displayName || user.email,
      role: userProfile.role,
      avatar: `https://picsum.photos/seed/${userProfile.avatarSeed}/40/40`,
      task: task,
      timestamp: serverTimestamp(),
      userId: user.uid,
    };
    
    const checkoutsCollection = collection(firestore, 'checkouts');

    // addDocumentNonBlocking does not return a promise that resolves on completion,
    // so we'll reset the form optimistically.
    addDocumentNonBlocking(checkoutsCollection, checkoutData);
    
    toast({
        title: "Check-out posted!",
        description: "Your update has been shared with the team.",
    });

    setTask('');
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What did you wrap up today?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            required
            className="min-h-[60px]"
          />
          <Button type="submit" className="w-full" disabled={loading || !task.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Check-out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
