
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Testimony } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Mic, FileText, Video, MessageSquareQuote, Tags } from 'lucide-react';
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
  const hasAudio = !!testimony.audioUrl;
  const hasVideo = !!testimony.videoUrl;
  const hasText = !!testimony.text;
  const hasSummary = !!testimony.summary;
  const hasQuotes = testimony.quotes && testimony.quotes.length > 0;
  const hasHashtags = testimony.hashtags && testimony.hashtags.length > 0;

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
      <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {hasSummary && (
                 <AccordionItem value="summary">
                    <AccordionTrigger>View AI Summary</AccordionTrigger>
                    <AccordionContent>
                       <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                            {testimony.summary}
                        </blockquote>
                    </AccordionContent>
                </AccordionItem>
            )}
            {hasQuotes && (
                <AccordionItem value="quotes">
                    <AccordionTrigger>View Key Quotes</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                        {testimony.quotes.map((quote, index) => (
                             <div key={index} className="flex items-start gap-2">
                                <MessageSquareQuote className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <p className="text-muted-foreground italic">"{quote}"</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
             {hasHashtags && (
                <AccordionItem value="hashtags">
                    <AccordionTrigger>View Suggested Hashtags</AccordionTrigger>
                    <AccordionContent className="flex flex-wrap gap-2 pt-4">
                        {testimony.hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
             {hasText && (
                 <AccordionItem value="full-transcript">
                    <AccordionTrigger>View Full Transcript</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-full">
                       <p>{testimony.text}</p>
                    </AccordionContent>
                </AccordionItem>
            )}
          </Accordion>
      </CardContent>
      {(hasAudio || hasVideo) && (
         <CardFooter>
          <div className="flex gap-2">
            {hasAudio && <audio controls src={testimony.audioUrl}>Your browser does not support the audio element.</audio>}
            {hasVideo && <video controls src={testimony.videoUrl} className="w-full rounded-md">Your browser does not support the video element.</video>}
          </div>
        </CardFooter>
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
