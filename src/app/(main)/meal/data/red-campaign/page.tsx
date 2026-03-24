'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { SchoolVisit, PadsDistribution } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, Edit, PlusCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface MHMTraining {
  id: string;
  schoolName?: string;
  school?: string;
  date?: string;
  dateOfTraining?: string;
  girlsReached?: number;
  participantsReached?: number;
  userName?: string;
  facilitator?: string;
  createdAt?: any;
}

function SchoolVisitsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const visitsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'school-visits'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);
    const { data: visits, isLoading } = useCollection<SchoolVisit>(visitsQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        await deleteDocumentNonBlocking(doc(firestore, 'school-visits', id));
        toast({ title: 'Visit Deleted' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button asChild size="sm"><Link href="/meal/red-campaign/school-visit"><PlusCircle className="mr-2 h-4 w-4" /> Log Visit</Link></Button>
            </div>
            <div className="sm:hidden space-y-4">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
                {visits && visits.length > 0 ? (
                    visits.map((visit) => (
                    <Card key={visit.id}>
                        <CardHeader className="py-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{visit.schoolName}</CardTitle>
                                    <CardDescription>{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</CardDescription>
                                </div>
                                <Badge variant="outline">By: {visit.userName}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 flex gap-2 justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Visit?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(visit.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    !isLoading && <EmptyState icon={Heart} title="No Visits Logged" description="" />
                )}
            </div>
            
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Date</TableHead><TableHead>Logged By</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {visits && visits.length > 0 ? (
                            visits.map((visit) => (
                            <TableRow key={visit.id}>
                                <TableCell className="font-medium">{visit.schoolName}</TableCell>
                                <TableCell>{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</TableCell>
                                <TableCell>{visit.userName}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Delete Visit?</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(visit.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            !isLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center">No school visits logged.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PadsDistributionTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const distributionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'pads-distributions'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);
    const { data: distributions, isLoading } = useCollection<PadsDistribution>(distributionsQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        await deleteDocumentNonBlocking(doc(firestore, 'pads-distributions', id));
        toast({ title: 'Distribution Deleted' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button asChild size="sm"><Link href="/meal/red-campaign/pads-distribution"><PlusCircle className="mr-2 h-4 w-4" /> Log Distribution</Link></Button>
            </div>
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
                        <CardContent className="pb-4 text-sm flex justify-between items-center">
                            <div>
                                <p><strong>Pads:</strong> {dist.numberOfPads} · <strong>Girls:</strong> {dist.girlsReached}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Distribution?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(dist.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    !isLoading && <EmptyState icon={Heart} title="No Distributions Logged" description="" />
                )}
            </div>

            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead>School/Community</TableHead><TableHead>Date</TableHead><TableHead>Pads</TableHead><TableHead>Girls</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {distributions && distributions.length > 0 ? (
                            distributions.map((dist) => (
                            <TableRow key={dist.id}>
                                <TableCell className="font-medium">{dist.school}</TableCell>
                                <TableCell>{formatDateSafe(dist.date, 'dateOnly')}</TableCell>
                                <TableCell>{dist.numberOfPads}</TableCell>
                                <TableCell>{dist.girlsReached}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Delete Distribution?</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(dist.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            !isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">No pad distributions logged.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function MHMTrainingsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const trainingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'mhm-trainings'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore]);
    const { data: trainings, isLoading } = useCollection<MHMTraining>(trainingsQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        await deleteDocumentNonBlocking(doc(firestore, 'mhm-trainings', id));
        toast({ title: 'Training Deleted' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button asChild size="sm"><Link href="/meal/red-campaign/mhm-training"><PlusCircle className="mr-2 h-4 w-4" /> Log Training</Link></Button>
            </div>
            <div className="sm:hidden space-y-4">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
                {trainings && trainings.length > 0 ? (
                    trainings.map((t) => (
                    <Card key={t.id}>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">{t.schoolName || t.school || 'Training'}</CardTitle>
                            <CardDescription>{formatDateSafe(t.date || t.dateOfTraining, 'dateOnly')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4 text-sm flex justify-between items-center">
                            <div>
                                <p><strong>Participants:</strong> {t.girlsReached || t.participantsReached || 0}</p>
                                {t.userName && <p className="text-muted-foreground text-xs">By: {t.userName}</p>}
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Training?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(t.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    !isLoading && <EmptyState icon={Heart} title="No Trainings Logged" description="" />
                )}
            </div>

            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Date</TableHead><TableHead>Participants</TableHead><TableHead>Facilitator</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {trainings && trainings.length > 0 ? (
                            trainings.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.schoolName || t.school || 'Training'}</TableCell>
                                <TableCell>{formatDateSafe(t.date || t.dateOfTraining, 'dateOnly')}</TableCell>
                                <TableCell>{t.girlsReached || t.participantsReached || 0}</TableCell>
                                <TableCell>{t.userName || t.facilitator || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Delete Training?</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(t.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            !isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">No MHM trainings logged.</TableCell></TableRow>
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
          View, edit, and delete all RED Campaign records.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="visits">
                <TabsList>
                    <TabsTrigger value="visits">School Visits</TabsTrigger>
                    <TabsTrigger value="distributions">Pads Distributions</TabsTrigger>
                    <TabsTrigger value="trainings">MHM Trainings</TabsTrigger>
                </TabsList>
                <TabsContent value="visits" className="mt-4">
                    <SchoolVisitsTable />
                </TabsContent>
                <TabsContent value="distributions" className="mt-4">
                    <PadsDistributionTable />
                </TabsContent>
                <TabsContent value="trainings" className="mt-4">
                    <MHMTrainingsTable />
                </TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
