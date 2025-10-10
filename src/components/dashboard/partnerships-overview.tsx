
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Partnership } from '@/lib/types';
import { Handshake } from 'lucide-react';
import Link from 'next/link';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Potential": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Inactive": "border-gray-500 bg-gray-500/10 text-gray-500",
};


export function PartnershipsOverview() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'), where('status', '==', 'Potential'), orderBy('createdAt', 'desc'), limit(5));
  }, []);

  const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  return (
    <Card>
      <CardHeader>
          <CardTitle>Partnership Pipeline</CardTitle>
          <CardDescription>
            A look at potential new partners.{' '}
            <Link href="/management/partnerships" className="text-primary hover:underline">Manage Partners</Link>
          </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Next Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                </TableRow>
              ))
            )}
            {partnerships && partnerships.length > 0 ? (
                partnerships.map((partner) => (
                    <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.name}</TableCell>
                        <TableCell>{partner.nextStep}</TableCell>
                    </TableRow>
                ))
            ) : (
              !isLoading && (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Handshake className="h-8 w-8" />
                        <span>No potential partners in pipeline.</span>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
