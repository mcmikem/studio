
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
import type { SLF_School, SLF_Prefect, PrefectPerformance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function SchoolsTable() {
    const firestore = useFirestore();
    const schoolsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'slf-schools'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data, isLoading } = useCollection<SLF_School>(schoolsQuery);

    return (
        <Table>
            <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Contact Teacher</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>
                ))}
                {data && data.map(s => (
                    <TableRow key={s.id}><TableCell>{s.schoolName}</TableCell><TableCell>{s.contactTeacher}</TableCell><TableCell>{s.phone}</TableCell></TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function PrefectsTable() {
     const firestore = useFirestore();
    const prefectsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'slf-prefects'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data, isLoading } = useCollection<SLF_Prefect>(prefectsQuery);
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>School</TableHead><TableHead>Position</TableHead></TableRow></TableHeader>
            <TableBody>
                 {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>
                ))}
                {data && data.map(p => (
                    <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.schoolName}</TableCell><TableCell>{p.position}</TableCell></TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function PerformanceTable() {
     const firestore = useFirestore();
    const performanceQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'prefect-performance'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data, isLoading } = useCollection<PrefectPerformance>(performanceQuery);
     const calculateAverage = (p: PrefectPerformance) => (p.visibilityScore + p.disciplineScore + p.initiativeScore) / 3;

    return (
        <Table>
            <TableHeader><TableRow><TableHead>Prefect</TableHead><TableHead>Month</TableHead><TableHead>Avg. Score</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8" /></TableCell></TableRow>
                ))}
                {data && data.map(p => (
                    <TableRow key={p.id}><TableCell>{p.prefectName}</TableCell><TableCell>{p.month}</TableCell><TableCell>{calculateAverage(p).toFixed(1)} / 5</TableCell></TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export default function SLFDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Student Leaders Forum Data
        </h1>
        <p className="text-muted-foreground">
          View all data for SLF schools, prefects, and performance reports.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="schools">
                <TabsList>
                    <TabsTrigger value="schools">Registered Schools</TabsTrigger>
                    <TabsTrigger value="prefects">Registered Prefects</TabsTrigger>
                    <TabsTrigger value="performance">Performance Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="schools" className="mt-4"><SchoolsTable/></TabsContent>
                <TabsContent value="prefects" className="mt-4"><PrefectsTable/></TabsContent>
                <TabsContent value="performance" className="mt-4"><PerformanceTable/></TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
