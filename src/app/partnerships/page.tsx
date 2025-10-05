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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Potential": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Inactive": "border-gray-500 bg-gray-500/10 text-gray-500",
};

export default function PartnershipsPage() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'), orderBy('name'));
  }, [firestore]);
  const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Partnerships
        </h1>
        <p className="text-muted-foreground">
          Manage and track all partner relations and engagements.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Partner Database</CardTitle>
            <CardDescription>A central list of all Omuto Foundation partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                  </TableRow>
                ))}
              {partnerships && partnerships.length > 0 ? (
                partnerships.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.contactPerson}</TableCell>
                    <TableCell>
                      <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">
                        {partner.contactEmail}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[partner.status]}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.nextStep}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                    <TableRow>
                        <TableCell
                        colSpan={5}
                        className="h-48 text-center text-muted-foreground"
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Users className="h-12 w-12" />
                                <span className="text-lg font-semibold">No Partners Found</span>
                                <p className="text-sm">Your partner database is empty. Add a partner to get started.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
