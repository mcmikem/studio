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
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>)}
                {data?.map(c => (
                    <Card key={c.id}>
                        <CardHeader className="py-4 px-4 pb-2">
                             <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">{c.format}</Badge>
                                <span className="text-[10px] font-bold text-omuto-navy/40 uppercase font-mono">{formatDateSafe(c.dateCreated, 'dateOnly')}</span>
                             </div>
                             <CardTitle className="text-sm font-black uppercase text-omuto-navy mt-2 leading-tight">{c.contentTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-omuto-navy/60">BY: {c.creatorName}</span>
                            <Button asChild variant="outline" size="sm" className="shadow-comic-sm">
                                <Link href={c.link} target="_blank">VIEW CONTENT</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 px-6">Date</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Title</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Creator</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Format</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 text-right pr-6">Link</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(c => <TableRow key={c.id}>
                            <TableCell className="px-6 font-mono text-[10px] font-bold text-omuto-navy/50">{formatDateSafe(c.dateCreated, 'dateOnly')}</TableCell>
                            <TableCell className="font-black uppercase text-xs leading-tight max-w-[200px] truncate">{c.contentTitle}</TableCell>
                            <TableCell className="font-bold text-xs uppercase text-omuto-navy/70">{c.creatorName}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wide">{c.format}</Badge></TableCell>
                            <TableCell className="text-right pr-6"><Button asChild variant="link" className="text-omuto-red font-black uppercase text-[10px]"><Link href={c.link} target="_blank">View</Link></Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
