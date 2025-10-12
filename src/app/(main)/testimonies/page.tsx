'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Testimony } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Mic, FileText, Video } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function TestimonyCard({ testimony }: { testimony: Testimony }) {
  const hasAudio = !!testimony.audioUrl;
  const hasVideo = !!testimony.videoUrl;
  const hasText = !!testimony.text;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{testimony.title}</CardTitle>
          <div className="flex gap-2">
            {hasText && <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" /> Text</Badge>}
            {hasAudio && <Badge variant="secondary"><Mic className="h-3 w-3 mr-1" /> Audio</Badge>}
            {hasVideo && <Badge variant="secondary"><Video className="h-3 w-3 mr-1" /> Video</Badge>}
          </div>
        </div>
        <CardDescription>
          Captured by {testimony.userName} on {formatDateSafe(testimony.createdAt, 'dateOnly')}
        </CardDescription>
      </CardHeader>
      {hasText && (
        <CardContent>
          <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
            {testimony.text}
          </blockquote>
        </CardContent>
      )}
      {(hasAudio || hasVideo) && (
         <CardContent>
          <div className="flex gap-2">
            {hasAudio && <Button variant="outline" size="sm">Play Audio</Button>}
            {hasVideo && <Button variant="outline" size="sm">Watch Video</Button>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TestimoniesPage() {
  const firestore = useFirestore();

  const testimoniesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonies'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: testimonies, isLoading } = useCollection<Testimony>(testimoniesQuery);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-8 w-8" />
          Testimony Library
        </h1>
        <p className="text-muted-foreground">
          A central repository of all captured success stories and testimonials.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && testimonies && testimonies.length > 0 ? (
        <div className="space-y-4">
          {testimonies.map((testimony) => (
            <TestimonyCard key={testimony.id} testimony={testimony} />
          ))}
        </div>
      ) : (
        !isLoading && (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Mic}
                title="No Testimonies Yet"
                description="Your library is empty. Go capture a story from the field!"
              >
                 <Button asChild className="mt-4">
                    <Link href="/record-testimony">Capture First Testimony</Link>
                </Button>
              </EmptyState>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
