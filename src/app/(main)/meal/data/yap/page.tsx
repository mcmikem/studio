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
    <Table>
      <TableHeader><TableRow><TableHead>Chapter Name</TableHead><TableHead>Leader</TableHead><TableHead>Location</TableHead><TableHead>Members</TableHead></TableRow></TableHeader>
      <TableBody>
        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
        {data?.map(c => <TableRow key={c.id}><TableCell>{c.chapterName}</TableCell><TableCell>{c.leader}</TableCell><TableCell>{c.location}</TableCell><TableCell>{c.membersCount}</TableCell></TableRow>)}
      </TableBody>
    </Table>
  );
}

function ReportsTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'yap-reports'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<YAP_Report>(queryRef);
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Activities</TableHead><TableHead>Attendance</TableHead></TableRow></TableHeader>
      <TableBody>
        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
        {data?.map(r => <TableRow key={r.id}><TableCell>{r.month}</TableCell><TableCell>{r.activities}</TableCell><TableCell>{r.attendance}</TableCell></TableRow>)}
      </TableBody>
    </Table>
  );
}

function GrantsTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'seed-grant-applications'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<SeedGrantApplication>(queryRef);
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Applicant</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
      <TableBody>
        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
        {data?.map(g => <TableRow key={g.id}><TableCell>{g.projectTitle}</TableCell><TableCell>{g.applicantName}</TableCell><TableCell>{formatCurrency(g.amountRequested)}</TableCell></TableRow>)}
      </TableBody>
    </Table>
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
