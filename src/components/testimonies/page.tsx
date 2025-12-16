

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Testimony } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Mic, FileText, Video, MessageSquareQuote, Wand } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function TestimonyCard({ testimony }: { testimony: Testimony }) {
  const hasAudio = !!(testimony.mediaUrls && testimony.mediaUrls.some(url => url.includes('audio')));
  const hasVideo = !!(testimony.mediaUrls && testimony.mediaUrls.some(url => url.includes('video')));
  const hasSummary = !!testimony.summary;
  const hasQuotes = testimony.quotes && testimony.quotes.length > 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{testimony.title}</CardTitle>
           <div className="flex gap-2">
            {hasAudio && <Badge variant="secondary"><Mic className="h-3 w-3 mr-1" /> Audio</Badge>}
            {hasVideo && <Badge variant="secondary"><Video className="h-3 w-3 mr-1" /> Video</Badge>}
          </div>
        </div>
        <CardDescription>
          Captured by {testimony.userName} on {formatDateSafe(testimony.createdAt, 'dateOnly')}
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="story">
              <AccordionTrigger>View Story Details</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                  <div>
                      <h4 className="font-semibold text-sm">Before</h4>
                      <p className="text-muted-foreground text-sm">{testimony.beforeSituation}</p>
                  </div>
                  <div>
                      <h4 className="font-semibold text-sm">After</h4>
                      <p className="text-muted-foreground text-sm">{testimony.afterSituation}</p>
                  </div>
                   <div>
                      <h4 className="font-semibold text-sm">Quote</h4>
                       <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                           "{testimony.quote}"
                        </blockquote>
                  </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
      </CardContent>
       <CardFooter className="flex-col items-start gap-4">
          {testimony.mediaUrls?.map(url => {
            if (url.includes('video')) {
              return <video key={url} controls src={url} className="w-full rounded-md" />
            }
            if (url.includes('audio')) {
              return <audio key={url} controls src={url} className="w-full" />
            }
            if (url.includes('image') || url.includes('img')) {
               return <img key={url} src={url} alt="Testimony media" className="w-full rounded-md" />
            }
            return null;
          })}
           <Button asChild variant="outline" className="w-full">
            <Link href={`/impact-story?testimonyId=${testimony.id}`}>
              <Wand className="mr-2 h-4 w-4" />
              Generate Social Media Post
            </Link>
          </Button>
      </CardFooter>
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
          A central repository of all captured success stories and testimonials, analyzed by AI.
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
                title="Your Testimony Library is Empty"
                description="Use the 'Record Testimony' form to capture your first success story from the field."
              >
                 <Button asChild className="mt-4">
                    <Link href="/record-testimony">Capture a Story</Link>
                </Button>
              </EmptyState>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
