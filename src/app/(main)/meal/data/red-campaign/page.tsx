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
import { Heart, Trash2, Edit, PlusCircle, History, ClipboardCheck, Package, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/ui/form-shell';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';

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
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild className="btn-omuto rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">
                    <Link href="/meal/red-campaign/school-visit">
                        <PlusCircle className="mr-2 h-5 w-5" /> Log New Visit
                    </Link>
                </Button>
            </div>
            
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="sm:hidden divide-y divide-black/5">
                        {isLoading && Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-6 space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                        ))}
                        {visits && visits.length > 0 ? (
                            visits.map((visit) => (
                                <div key={visit.id} className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-omuto-navy uppercase italic tracking-tighter">{visit.schoolName}</h4>
                                        <Badge variant="outline" className="rounded-lg border-2 font-black uppercase tracking-widest text-[9px]">
                                            {visit.userName}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</p>
                                    <div className="flex justify-end">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="text-omuto-red hover:bg-omuto-red/5 rounded-xl font-bold">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-[2.5rem] border-2">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-black uppercase italic tracking-tighter">Confirm Deletion</AlertDialogTitle>
                                                    <AlertDialogDescription className="font-bold">This visit record will be permanently removed.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(visit.id)} className="rounded-2xl bg-omuto-red font-black uppercase tracking-widest text-[10px]">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !isLoading && (
                                <div className="p-12 text-center">
                                    <EmptyState icon={Heart} title="No Visits Logged" description="Start by adding your first school visit." />
                                </div>
                            )
                        )}
                    </div>

                    <div className="hidden sm:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 border-b">
                                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">School</TableHead>
                                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Date</TableHead>
                                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Logged By</TableHead>
                                    <TableHead className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-black/5">
                                {visits && visits.length > 0 ? (
                                    visits.map((visit) => (
                                        <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="p-6 font-black text-omuto-navy uppercase italic tracking-tighter">{visit.schoolName}</TableCell>
                                            <TableCell className="p-6 text-xs font-bold text-omuto-navy/60 tabular-nums">{formatDateSafe(visit.dateOfVisit, 'dateOnly')}</TableCell>
                                            <TableCell className="p-6">
                                                <Badge variant="outline" className="rounded-lg border-2 border-black/5 font-black uppercase tracking-widest text-[9px] px-3 py-1">
                                                    {visit.userName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-6 text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-omuto-red hover:bg-omuto-red/5 rounded-xl transition-all">
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2.5rem] border-2">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-black uppercase italic tracking-tighter">Delete Visit Record?</AlertDialogTitle>
                                                            <AlertDialogDescription className="font-bold">This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(visit.id)} className="rounded-2xl bg-omuto-red font-black uppercase tracking-widest text-[10px]">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    !isLoading && <TableRow><TableCell colSpan={4} className="h-32 text-center font-bold text-muted-foreground">No school visits logged.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
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
    <div className="container max-w-5xl py-8 space-y-8">
      <PageHeader 
        icon={Heart}
        title="RED Campaign Records"
        description="Comprehensive audit trail of school visits, MHM trainings, and pad distributions."
        breadcrumbs={[
            { name: 'Xperience', href: '/school-xperience' },
            { name: 'RED Campaign', href: '/meal/data/red-campaign' }
        ]}
      />

        <Tabs defaultValue="visits" className="w-full">
            <div className="bg-muted/30 p-1.5 rounded-[2rem] inline-flex mb-8 border-2 border-black/5">
                <TabsList className="bg-transparent h-12 gap-1 p-0">
                    <TabsTrigger value="visits" className="rounded-[1.5rem] px-8 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-comic-sm transition-all h-full flex items-center gap-2">
                        <History className="h-4 w-4" /> School Visits
                    </TabsTrigger>
                    <TabsTrigger value="distributions" className="rounded-[1.5rem] px-8 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-comic-sm transition-all h-full flex items-center gap-2">
                        <Package className="h-4 w-4" /> Distributions
                    </TabsTrigger>
                    <TabsTrigger value="trainings" className="rounded-[1.5rem] px-8 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-comic-sm transition-all h-full flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> MHM Trainings
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="visits" className="mt-0 animate-in fade-in-50 duration-500">
                <FormSection title="Audit: School Visits" defaultOpen={true}>
                    <SchoolVisitsTable />
                </FormSection>
            </TabsContent>
            
            <TabsContent value="distributions" className="mt-0 animate-in fade-in-50 duration-500">
                <FormSection title="Logistics: Pad Distribution" defaultOpen={true}>
                    <PadsDistributionTable />
                </FormSection>
            </TabsContent>
            
            <TabsContent value="trainings" className="mt-0 animate-in fade-in-50 duration-500">
                <FormSection title="Education: MHM Training" defaultOpen={true}>
                    <MHMTrainingsTable />
                </FormSection>
            </TabsContent>
        </Tabs>
    </div>
  );
}
