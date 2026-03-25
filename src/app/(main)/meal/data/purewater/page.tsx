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
import type { WaterSource, WASH_Assessment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Droplets, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

function WaterSourcesTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'water-sources'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<WaterSource>(queryRef);
    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
                {data?.map(s => (
                    <Card key={s.id}>
                        <CardHeader className="py-3 px-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase text-omuto-navy">{s.sourceName}</CardTitle>
                                {s.functional ? <CheckCircle className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                            </div>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold uppercase">TYPE:</span>
                                <span className="font-black">{s.type}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Source</TableHead><TableHead className="font-black uppercase text-[10px]">Type</TableHead><TableHead className="font-black uppercase text-[10px]">Functional</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(s => <TableRow key={s.id}><TableCell className="font-bold">{s.sourceName}</TableCell><TableCell className="text-xs uppercase">{s.type}</TableCell><TableCell>{s.functional ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-red-500"/>}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
function WashAssessmentsTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'wash-assessments'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<WASH_Assessment>(queryRef);
     const conditionColors: { [key: string]: string } = {
        "Good": "border-green-500 bg-green-500/10 text-green-500",
        "Fair": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
        "Poor": "border-red-500 bg-red-500/10 text-red-500",
    };
    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>)}
                {data?.map(a => (
                    <Card key={a.id}>
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-black uppercase text-omuto-navy">{a.school}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-xs space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-bold uppercase">LATRINE CONDITION:</span>
                                <Badge variant="outline" className={conditionColors[a.latrineCondition]}>{a.latrineCondition}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold uppercase">STATIONS:</span>
                                <span className="font-black">{a.handwashingStations}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold uppercase">SOAP AVAILABLE:</span>
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">{a.soapAvailable ? 'YES' : 'NO'}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">School</TableHead><TableHead className="font-black uppercase text-[10px]">Stations</TableHead><TableHead className="font-black uppercase text-[10px]">Soap</TableHead><TableHead className="font-black uppercase text-[10px]">Latrine Condition</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(a => <TableRow key={a.id}><TableCell className="font-bold">{a.school}</TableCell><TableCell>{a.handwashingStations}</TableCell><TableCell>{a.soapAvailable ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</TableCell><TableCell><Badge variant="outline" className={conditionColors[a.latrineCondition]}>{a.latrineCondition}</Badge></TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}


export default function PureWaterDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <Droplets className="h-8 w-8" />
          PureWater Initiative Data
        </h1>
        <p className="text-muted-foreground">
          View data for water source mapping and WASH assessments.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="sources">
                <TabsList>
                    <TabsTrigger value="sources">Mapped Water Sources</TabsTrigger>
                    <TabsTrigger value="assessments">WASH Assessments</TabsTrigger>
                </TabsList>
                <TabsContent value="sources" className="mt-4"><WaterSourcesTable /></TabsContent>
                <TabsContent value="assessments" className="mt-4"><WashAssessmentsTable /></TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
