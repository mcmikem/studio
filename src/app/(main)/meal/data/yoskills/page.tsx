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
import type { YoSkillsCircle, BusinessProgress } from '@/lib/types';

type BusinessIdea = any;
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe } from '@/lib/utils';

function CirclesTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'yoskills-circles'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<YoSkillsCircle>(queryRef);
  return (
      <Table>
          <TableHeader><TableRow><TableHead>Circle Name</TableHead><TableHead>Coach</TableHead><TableHead>Location</TableHead><TableHead>Members</TableHead></TableRow></TableHeader>
          <TableBody>
              {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
              {data?.map(c => <TableRow key={c.id}><TableCell>{c.circleName}</TableCell><TableCell>{c.coach}</TableCell><TableCell>{c.location}</TableCell><TableCell>{c.membersCount}</TableCell></TableRow>)}
          </TableBody>
      </Table>
  )
}

function IdeasTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'business-ideas'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<BusinessIdea>(queryRef);
  return (
      <Table>
          <TableHeader><TableRow><TableHead>Business Name</TableHead><TableHead>Problem Solved</TableHead><TableHead>Capital Needed</TableHead></TableRow></TableHeader>
          <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(i => <TableRow key={i.id}><TableCell>{i.businessName}</TableCell><TableCell>{i.problemSolved}</TableCell><TableCell>{formatCurrency(i.startupCapitalNeeded)}</TableCell></TableRow>)}
          </TableBody>
      </Table>
  )
}

function ProgressTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'business-progress'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<BusinessProgress>(queryRef);
  return (
      <Table>
          <TableHeader><TableRow><TableHead>Business ID</TableHead><TableHead>Month</TableHead><TableHead>Sales</TableHead></TableRow></TableHeader>
          <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(p => <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.businessIdeaId}</TableCell><TableCell>{p.month}</TableCell><TableCell>{formatCurrency(p.monthlySales)}</TableCell></TableRow>)}
          </TableBody>
      </Table>
  )
}

export default function YoSkillsDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-8 w-8" />
          YoSkills Data Hub
        </h1>
        <p className="text-muted-foreground">
          Track entrepreneurship circles, business ideas, and monthly progress.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="circles">
                <TabsList>
                    <TabsTrigger value="circles">Circles</TabsTrigger>
                    <TabsTrigger value="ideas">Business Ideas</TabsTrigger>
                    <TabsTrigger value="progress">Business Progress</TabsTrigger>
                </TabsList>
                <TabsContent value="circles" className="mt-4"><CirclesTable/></TabsContent>
                <TabsContent value="ideas" className="mt-4"><IdeasTable/></TabsContent>
                <TabsContent value="progress" className="mt-4"><ProgressTable/></TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
