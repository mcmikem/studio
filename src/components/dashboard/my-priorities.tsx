'use client';

import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, writeBatch, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { sampleKeyResults, sampleUsers, samplePrograms, samplePartnerships, sampleProjects, sampleImpactMetrics } from '@/lib/data';


// Sample alerts to pre-populate for the demo user
const sampleAlerts = [
    { type: 'Urgent', message: 'RED Campaign funding proposal due tomorrow.', priority: 'High', action: '/management/programs' },
    { type: 'Reminder', message: 'Submit your weekly field report by EOD.', priority: 'Medium', action: '/forms' },
    { type: 'Info', message: 'New "Projects" module is now live.', priority: 'Low', action: '/management/projects' },
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
      where('completed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);
  
  // Effect to seed sample data for the demo user
  useEffect(() => {
    if (user && firestore && !isLoading && !isSeeding) {
        const hasSeeded = localStorage.getItem(`seeded_demo_data_${user.uid}_v2`);
        if (!hasSeeded) {
            setIsSeeding(true);
            
            const collectionsToSeed = [
                { name: 'users', data: sampleUsers, check: true },
                { name: 'programs', data: samplePrograms, check: true },
                { name: 'partnerships', data: samplePartnerships, check: true },
                { name: 'key-results', data: sampleKeyResults, check: true },
                { name: 'projects', data: sampleProjects, check: true },
                { name: 'impact-metrics', data: sampleImpactMetrics, check: true },
                { name: 'alerts', data: sampleAlerts, check: false }, // Always seed alerts for demo
            ];

            const seedData = async () => {
                const batch = writeBatch(firestore);

                for (const coll of collectionsToSeed) {
                    const collectionRef = collection(firestore, coll.name);
                    
                    if (coll.check) {
                        const snapshot = await getDocs(query(collectionRef, limit(1)));
                        if (!snapshot.empty) {
                            console.log(`Collection ${coll.name} already has data. Skipping seed.`);
                            continue;
                        }
                    }

                    console.log(`Seeding collection: ${coll.name}`);
                    coll.data.forEach((item: any) => {
                        const docRef = doc(collectionRef);
                        // Ensure a 'createdAt' is added if it's a main collection item
                        const dataToSet = { ...item, createdAt: item.createdAt || serverTimestamp() };
                        batch.set(docRef, dataToSet);
                    });
                }

                await batch.commit();
                localStorage.setItem(`seeded_demo_data_${user.uid}_v2`, 'true');
                setIsSeeding(false);
                // Optionally reload to show new data, or rely on real-time updates
                window.location.reload(); 
            };

            seedData().catch(err => {
                console.error("Error seeding data:", err);
                setIsSeeding(false);
            });
        }
    }
  }, [user, firestore, isLoading, isSeeding]);


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
            {isSeeding && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /><span>Populating your app with data...</span></div>}
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
            <Link href="/profile?tab=tasks">View all tasks</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
