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
            <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
                <TableBody>
                    {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                    {data?.map(v => <TableRow key={v.id}>
                        <TableCell>{v.name}</TableCell>
                        <TableCell>{v.role}</TableCell>
                        <TableCell>{v.contact}</TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  );
}
