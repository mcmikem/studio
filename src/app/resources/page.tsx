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
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake, Goal, Users, Building } from 'lucide-react';

function FundingPipeline() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'partnerships'),
      where('status', '==', 'Potential'),
      orderBy('name')
    );
  }, [firestore]);

  const { data: partnerships, isLoading } = useCollection<Partnership>(
    partnershipsQuery
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Pipeline</CardTitle>
        <CardDescription>
          Potential partners we are actively engaging.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Next Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                </TableRow>
              ))}
            {partnerships && partnerships.length > 0 ? (
              partnerships.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.contactPerson}</TableCell>
                  <TableCell>{partner.nextStep}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No potential partners in the pipeline.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DonorDirectory() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'partnerships'),
      where('status', '==', 'Active'),
      orderBy('name')
    );
  }, [firestore]);

  const { data: partnerships, isLoading } = useCollection<Partnership>(
    partnershipsQuery
  );

    return (
    <Card>
      <CardHeader>
        <CardTitle>Donor Directory</CardTitle>
        <CardDescription>
          A list of our active donors and partners.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
            {isLoading && Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
            {partnerships && partnerships.length > 0 ? (
                partnerships.map(partner => (
                    <div key={partner.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">{partner.contactPerson} - <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">{partner.contactEmail}</a></p>
                        </div>
                    </div>
                ))
            ) : (
                !isLoading && <p className="text-sm text-muted-foreground text-center p-8">No active partners found.</p>
            )}
         </div>
      </CardContent>
    </Card>
  );
}


export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-8 w-8" />
          Resource Mobilization
        </h1>
        <p className="text-muted-foreground">
          Manage donor relations, funding opportunities, and proposals.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <FundingPipeline />
        </div>
        <div>
            <DonorDirectory />
        </div>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Proposal Tracker</CardTitle>
          <CardDescription>
            Manage grant proposals and funding applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border-2 border-dashed border-border text-center p-8">
            <Goal className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Coming Soon
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              A dedicated tool for tracking grant application deadlines, submissions, and statuses is under construction.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
