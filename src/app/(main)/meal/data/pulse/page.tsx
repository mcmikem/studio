'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { PulseContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Wind } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PulseDataPage() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'pulse-content'), orderBy('dateCreated', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<PulseContent>(queryRef);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wind className="h-8 w-8" />
          Omuto Pulse Content
        </h1>
        <p className="text-muted-foreground">
          A log of all submitted content for the Omuto Pulse platform.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Creator</TableHead><TableHead>Format</TableHead><TableHead>Link</TableHead></TableRow></TableHeader>
                <TableBody>
                    {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8"/></TableCell></TableRow>)}
                    {data?.map(c => <TableRow key={c.id}>
                        <TableCell>{formatDateSafe(c.dateCreated, 'dateOnly')}</TableCell>
                        <TableCell>{c.contentTitle}</TableCell>
                        <TableCell>{c.creatorName}</TableCell>
                        <TableCell><Badge variant="secondary">{c.format}</Badge></TableCell>
                        <TableCell><Button asChild variant="link"><Link href={c.link} target="_blank">View</Link></Button></TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  );
}
