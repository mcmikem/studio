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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe } from '@/lib/utils';

function CirclesTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'yoskills-circles'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<YoSkillsCircle>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
          {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
          {data?.map(c => (
              <Card key={c.id}>
                <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-sm font-black uppercase text-omuto-navy">{c.circleName}</CardTitle>
                    <CardDescription className="text-xs font-bold text-omuto-red">Coach: {c.coach}</CardDescription>
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
              <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Circle Name</TableHead><TableHead className="font-black uppercase text-[10px]">Coach</TableHead><TableHead className="font-black uppercase text-[10px]">Location</TableHead><TableHead className="font-black uppercase text-[10px]">Members</TableHead></TableRow></TableHeader>
              <TableBody>
                  {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                  {data?.map(c => <TableRow key={c.id}><TableCell className="font-bold">{c.circleName}</TableCell><TableCell>{c.coach}</TableCell><TableCell>{c.location}</TableCell><TableCell>{c.membersCount}</TableCell></TableRow>)}
              </TableBody>
          </Table>
      </div>
    </>
  )
}

function IdeasTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'business-ideas'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<BusinessIdea>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
          {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
          {data?.map(i => (
              <Card key={i.id}>
                <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-sm font-black uppercase text-omuto-navy">{i.businessName}</CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4 text-xs space-y-2">
                    <p className="font-bold leading-tight line-clamp-2">{i.problemSolved}</p>
                    <div className="flex justify-between items-center p-2 bg-omuto-cream rounded-lg border border-omuto-navy/5">
                        <span className="font-black uppercase text-omuto-navy/40">CAPITAL:</span>
                        <span className="font-black">{formatCurrency(i.startupCapitalNeeded)}</span>
                    </div>
                </CardContent>
              </Card>
          ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
          <Table>
              <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Business Name</TableHead><TableHead className="font-black uppercase text-[10px]">Problem Solved</TableHead><TableHead className="font-black uppercase text-[10px]">Capital Needed</TableHead></TableRow></TableHeader>
              <TableBody>
                    {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                    {data?.map(i => <TableRow key={i.id}><TableCell className="font-bold">{i.businessName}</TableCell><TableCell className="text-xs line-clamp-1">{i.problemSolved}</TableCell><TableCell className="font-black text-omuto-red">{formatCurrency(i.startupCapitalNeeded)}</TableCell></TableRow>)}
              </TableBody>
          </Table>
      </div>
    </>
  )
}

function ProgressTable() {
  const firestore = useFirestore();
  const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'business-progress'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<BusinessProgress>(queryRef);
  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 sm:hidden">
          {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
          {data?.map(p => (
              <Card key={p.id}>
                <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-[10px] font-mono font-bold text-omuto-navy/40 uppercase tracking-tighter">IDEA ID: {p.businessIdeaId}</CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                         <Badge className="bg-omuto-navy text-white text-[10px] font-black uppercase">{p.month}</Badge>
                         <span className="font-black text-omuto-red">{formatCurrency(p.monthlySales)} Sales</span>
                    </div>
                </CardContent>
              </Card>
          ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
          <Table>
              <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Business ID</TableHead><TableHead className="font-black uppercase text-[10px]">Month</TableHead><TableHead className="font-black uppercase text-[10px]">Sales</TableHead></TableRow></TableHeader>
              <TableBody>
                    {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                    {data?.map(p => <TableRow key={p.id}><TableCell className="font-mono text-[10px] font-bold text-omuto-navy/50">{p.businessIdeaId}</TableCell><TableCell>{p.month}</TableCell><TableCell className="font-black">{formatCurrency(p.monthlySales)}</TableCell></TableRow>)}
              </TableBody>
          </Table>
      </div>
    </>
  )
}

export default function YoSkillsDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
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
