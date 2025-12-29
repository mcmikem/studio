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
        <Table>
            <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Type</TableHead><TableHead>Functional</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(s => <TableRow key={s.id}><TableCell>{s.sourceName}</TableCell><TableCell>{s.type}</TableCell><TableCell>{s.functional ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}</TableCell></TableRow>)}
            </TableBody>
        </Table>
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
        <Table>
            <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Stations</TableHead><TableHead>Soap</TableHead><TableHead>Latrine Condition</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(a => <TableRow key={a.id}><TableCell>{a.school}</TableCell><TableCell>{a.handwashingStations}</TableCell><TableCell>{a.soapAvailable ? 'Yes' : 'No'}</TableCell><TableCell><Badge variant="outline" className={conditionColors[a.latrineCondition]}>{a.latrineCondition}</Badge></TableCell></TableRow>)}
            </TableBody>
        </Table>
    )
}


export default function PureWaterDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
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
