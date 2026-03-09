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
import { collection, query, orderBy } from 'firebase/firestore';
import type { SLF_School, SLF_Prefect, PrefectPerformance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

function SchoolsTable() {
  const firestore = useFirestore();
  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'slf-schools'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data, isLoading } = useCollection<SLF_School>(schoolsQuery);

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
        {data?.map((s) => (
          <Card key={s.id}>
            <CardHeader className="py-3 px-4 pb-2">
              <CardTitle className="text-sm font-black uppercase text-omuto-navy">{s.schoolName}</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold uppercase">TEACHER:</span>
                <span className="font-black text-omuto-red">{s.contactTeacher}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold uppercase">PHONE:</span>
                <span className="font-mono font-bold">{(s as any).phone}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black uppercase text-[10px]">School</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Contact Teacher</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {data &&
              data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold">{s.schoolName}</TableCell>
                  <TableCell>{s.contactTeacher}</TableCell>
                  <TableCell className="font-mono text-xs">{(s as any).phone}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PrefectsTable() {
  const firestore = useFirestore();
  const prefectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'slf-prefects'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data, isLoading } = useCollection<SLF_Prefect>(prefectsQuery);

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
        {data?.map((p) => (
          <Card key={p.id}>
            <CardHeader className="py-3 px-4 pb-2">
               <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-black uppercase text-omuto-navy">{p.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{p.position}</Badge>
               </div>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs">
               <div className="flex justify-between">
                <span className="text-muted-foreground font-bold uppercase">SCHOOL:</span>
                <span className="font-black text-omuto-red">{(p as any).schoolName}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black uppercase text-[10px]">Name</TableHead>
              <TableHead className="font-black uppercase text-[10px]">School</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {data &&
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.name}</TableCell>
                  <TableCell>{(p as any).schoolName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-wide">{p.position}</Badge></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PerformanceTable() {
  const firestore = useFirestore();
  const performanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'prefect-performance'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data, isLoading } = useCollection<PrefectPerformance>(performanceQuery);
  const calculateAverage = (p: PrefectPerformance) =>
    (p.visibilityScore + p.disciplineScore + p.initiativeScore) / 3;

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
        {data?.map((p) => (
          <Card key={p.id}>
            <CardHeader className="py-3 px-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-black uppercase text-omuto-navy">{p.prefectName}</CardTitle>
                  <Badge className="bg-omuto-navy text-white text-[10px] font-black uppercase">{p.month}</Badge>
               </div>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs">
               <div className="flex justify-between p-2 bg-omuto-cream rounded-lg border border-omuto-navy/5">
                <span className="font-black uppercase text-omuto-navy/40">AVERAGE SCORE:</span>
                <span className="font-black text-omuto-red">{calculateAverage(p).toFixed(1)} / 5</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black uppercase text-[10px]">Prefect</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Month</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Avg. Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {data &&
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.prefectName}</TableCell>
                  <TableCell>{p.month}</TableCell>
                  <TableCell className="font-black">{calculateAverage(p).toFixed(1)} / 5</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
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
            <TabsContent value="schools" className="mt-4">
              <SchoolsTable />
            </TabsContent>
            <TabsContent value="prefects" className="mt-4">
              <PrefectsTable />
            </TabsContent>
            <TabsContent value="performance" className="mt-4">
              <PerformanceTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
