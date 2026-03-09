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
// Remove the import of these three
// import type { YAP_Chapter, YAP_Report, SeedGrantApplication } from '@/lib/types';

type YAP_Chapter = any;
type YAP_Report = any;
type SeedGrantApplication = any;
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function ChaptersTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'yap-chapters'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<YAP_Chapter>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
        {data?.map(c => (
          <Card key={c.id}>
            <CardHeader className="py-3 px-4 pb-2">
               <CardTitle className="text-sm font-black uppercase text-omuto-navy">{c.chapterName}</CardTitle>
               <CardDescription className="text-xs font-bold text-omuto-red">Leader: {c.leader}</CardDescription>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold uppercase">LOCATION:</span>
                <span className="font-black">{c.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold uppercase">MEMBERS:</span>
                <span className="font-black">{c.membersCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Chapter Name</TableHead><TableHead className="font-black uppercase text-[10px]">Leader</TableHead><TableHead className="font-black uppercase text-[10px]">Location</TableHead><TableHead className="font-black uppercase text-[10px]">Members</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
            {data?.map(c => <TableRow key={c.id}><TableCell className="font-bold">{c.chapterName}</TableCell><TableCell>{c.leader}</TableCell><TableCell>{c.location}</TableCell><TableCell>{c.membersCount}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ReportsTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'yap-reports'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<YAP_Report>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
        {data?.map(r => (
          <Card key={r.id}>
             <CardHeader className="py-3 px-4 pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-black uppercase text-omuto-navy">{r.month}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] font-black uppercase">{r.attendance} Attendees</Badge>
                </div>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs">
                <p className="font-bold leading-tight line-clamp-2">{r.activities}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Month</TableHead><TableHead className="font-black uppercase text-[10px]">Activities</TableHead><TableHead className="font-black uppercase text-[10px]">Attendance</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
            {data?.map(r => <TableRow key={r.id}><TableCell className="font-bold">{r.month}</TableCell><TableCell className="text-xs line-clamp-1">{r.activities}</TableCell><TableCell>{r.attendance}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function GrantsTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'seed-grant-applications'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<SeedGrantApplication>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
        {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
        {data?.map(g => (
          <Card key={g.id}>
            <CardHeader className="py-3 px-4 pb-2">
               <CardTitle className="text-sm font-black uppercase text-omuto-navy leading-tight">{g.projectTitle}</CardTitle>
               <CardDescription className="text-xs font-bold text-omuto-red">Applicant: {g.applicantName}</CardDescription>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs">
              <div className="flex justify-between items-center p-2 bg-omuto-cream rounded-lg border border-omuto-navy/5">
                <span className="font-black uppercase text-omuto-navy/40">AMOUNT:</span>
                <span className="font-black">{formatCurrency(g.amountRequested)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Project</TableHead><TableHead className="font-black uppercase text-[10px]">Applicant</TableHead><TableHead className="font-black uppercase text-[10px]">Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
            {data?.map(g => <TableRow key={g.id}><TableCell className="font-bold">{g.projectTitle}</TableCell><TableCell>{g.applicantName}</TableCell><TableCell className="font-black text-omuto-red">{formatCurrency(g.amountRequested)}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default function YAPDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Youth Action Pathway Data
        </h1>
        <p className="text-muted-foreground">
          View data for YAP chapters, reports, and seed grants.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="chapters">
                <TabsList>
                    <TabsTrigger value="chapters">Chapters</TabsTrigger>
                    <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
                    <TabsTrigger value="grants">Seed Grants</TabsTrigger>
                </TabsList>
                <TabsContent value="chapters" className="mt-4"><ChaptersTable/></TabsContent>
                <TabsContent value="reports" className="mt-4"><ReportsTable/></TabsContent>
                <TabsContent value="grants" className="mt-4"><GrantsTable/></TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
