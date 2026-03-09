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
import type { OFAVolunteer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OmutoCupDataPage() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'ofa-volunteers'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<OFAVolunteer>(queryRef);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Omuto Cup Data
        </h1>
        <p className="text-muted-foreground">
          View registered volunteers for Omuto Cup events.
        </p>
      </header>
       <Card>
        <CardHeader>
            <CardTitle>Registered Volunteers</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
                {data?.map(v => (
                    <Card key={v.id}>
                        <CardHeader className="py-4 px-4 pb-2">
                            <CardTitle className="text-sm font-black uppercase text-omuto-navy">{v.name}</CardTitle>
                            <CardDescription className="text-xs font-bold text-omuto-red">{v.role}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 text-xs">
                            <div className="p-2 bg-omuto-cream rounded-lg border border-omuto-navy/5">
                                <span className="text-[10px] font-black uppercase text-omuto-navy/40 block mb-1">Contact Details</span>
                                <p className="font-bold">{v.contact}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 pl-6">Name</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Role</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 pr-6">Contact</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(v => <TableRow key={v.id}>
                            <TableCell className="pl-6 font-bold">{v.name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-wide">{v.role}</Badge></TableCell>
                            <TableCell className="pr-6 font-mono text-[10px] font-bold">{v.contact}</TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
