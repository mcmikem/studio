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
import type { SchoolVisit, PadsDistribution } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function SchoolVisitsTable() {
    const firestore = useFirestore();
    const visitsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'school-visits'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);
    const { data: visits, isLoading } = useCollection<SchoolVisit>(visitsQuery);

    return (
        <div className="space-y-4">
            <div className="sm:hidden space-y-4">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
                {visits && visits.length > 0 ? (
                    visits.map((visit) => (
                    <Card key={visit.id}>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">{visit.schoolName}</CardTitle>
                            <CardDescription>{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4 text-sm text-muted-foreground">
                            Logged by: {visit.userName}
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    !isLoading && <EmptyState icon={Heart} title="No Visits Logged" description="" />
                )}
            </div>
            
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Date</TableHead><TableHead>Logged By</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            </TableRow>
                        ))}
                        {visits && visits.length > 0 ? (
                            visits.map((visit) => (
                            <TableRow key={visit.id}>
                                <TableCell className="font-medium">{visit.schoolName}</TableCell>
                                <TableCell>{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</TableCell>
                                <TableCell>{visit.userName}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            !isLoading && <TableRow><TableCell colSpan={3} className="h-24 text-center">No school visits logged.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PadsDistributionTable() {
    const firestore = useFirestore();
    const distributionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'pads-distributions'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);
    const { data: distributions, isLoading } = useCollection<PadsDistribution>(distributionsQuery);

    return (
        <div className="space-y-4">
            <div className="sm:hidden space-y-4">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
                {distributions && distributions.length > 0 ? (
                    distributions.map((dist) => (
                    <Card key={dist.id}>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">{dist.school}</CardTitle>
                            <CardDescription>{formatDateSafe(dist.date, 'dateOnly')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4 text-sm">
                            <p><strong>Pads Distributed:</strong> {dist.numberOfPads}</p>
                            <p><strong>Girls Reached:</strong> {dist.girlsReached}</p>
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    !isLoading && <EmptyState icon={Heart} title="No Distributions Logged" description="" />
                )}
            </div>

            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead>School/Community</TableHead><TableHead>Date</TableHead><TableHead>Pads Distributed</TableHead><TableHead>Girls Reached</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            </TableRow>
                        ))}
                        {distributions && distributions.length > 0 ? (
                            distributions.map((dist) => (
                            <TableRow key={dist.id}>
                                <TableCell className="font-medium">{dist.school}</TableCell>
                                <TableCell>{formatDateSafe(dist.date, 'dateOnly')}</TableCell>
                                <TableCell>{dist.numberOfPads}</TableCell>
                                <TableCell>{dist.girlsReached}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            !isLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center">No pad distributions logged.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default function RedCampaignDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-8 w-8" />
          RED Campaign Data
        </h1>
        <p className="text-muted-foreground">
          View all data related to school visits, trainings, and distributions.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="visits">
                <TabsList>
                    <TabsTrigger value="visits">School Visits</TabsTrigger>
                    <TabsTrigger value="distributions">Pads Distributions</TabsTrigger>
                </TabsList>
                <TabsContent value="visits" className="mt-4">
                    <SchoolVisitsTable />
                </TabsContent>
                <TabsContent value="distributions" className="mt-4">
                    <PadsDistributionTable />
                </TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
