'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { TaskTemplate } from '@/lib/types';
import { ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ChecklistsPage() {
  const templatesQuery = useMemoFirebase((db) => {
    return query(collection(db, 'task-templates'), orderBy('createdAt', 'desc'));
  }, []);

  const { data: templates, isLoading } = useCollection<TaskTemplate>(templatesQuery);

  // For now, we will display the first checklist. This can be expanded later.
  const checklistToDisplay = templates?.[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-8 w-8" />
          Operational Checklists
        </h1>
        <p className="text-muted-foreground">
          Standard Operating Procedures to ensure quality and consistency.
        </p>
      </header>

      <Card>
        {isLoading && (
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        )}
        {checklistToDisplay && !isLoading && (
          <>
            <CardHeader>
              <CardTitle>{checklistToDisplay.title}</CardTitle>
              <CardDescription>A standard operational procedure from the management templates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3 mt-4">
                  {checklistToDisplay.checklistItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox id={`${checklistToDisplay.id}-${itemIndex}`} />
                      <label
                        htmlFor={`${checklistToDisplay.id}-${itemIndex}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
            </CardContent>
          </>
        )}
        {!checklistToDisplay && !isLoading && (
          <CardContent className="pt-6">
            <EmptyState 
              icon={ListChecks}
              title="No Checklists Found"
              description="Management can create reusable task templates in the 'Templates' section."
            >
                <Button asChild className="mt-4"><Link href="/management/templates">Create a Template</Link></Button>
            </EmptyState>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
