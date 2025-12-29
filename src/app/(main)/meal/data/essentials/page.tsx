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
import type { ProductionLog, Sale, InventoryCheck } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function ProductionTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'essentials-production'), orderBy('date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<ProductionLog>(queryRef);
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Batch #</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(p => <TableRow key={p.id}><TableCell>{formatDateSafe(p.date, 'dateOnly')}</TableCell><TableCell>{p.product}</TableCell><TableCell>{p.batchNumber}</TableCell><TableCell>{p.quantity}</TableCell></TableRow>)}
            </TableBody>
        </Table>
    )
}
function SalesTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'essentials-sales'), orderBy('date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<Sale>(queryRef);
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(s => <TableRow key={s.id}><TableCell>{formatDateSafe(s.date, 'dateOnly')}</TableCell><TableCell>{s.product}</TableCell><TableCell>{s.quantity}</TableCell><TableCell>{formatCurrency(s.totalAmount)}</TableCell></TableRow>)}
            </TableBody>
        </Table>
    )
}
function InventoryTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'essentials-inventory'), orderBy('date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<InventoryCheck>(queryRef);
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Physical Count</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                {data?.map(i => <TableRow key={i.id}><TableCell>{formatDateSafe(i.date, 'dateOnly')}</TableCell><TableCell>{i.product}</TableCell><TableCell>{i.physicalCount}</TableCell></TableRow>)}
            </TableBody>
        </Table>
    )
}


export default function EssentialsDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-8 w-8" />
          Omuto Essentials Data
        </h1>
        <p className="text-muted-foreground">
          View all data for production, sales, and inventory.
        </p>
      </header>
       <Card>
        <CardContent className="pt-6">
            <Tabs defaultValue="sales">
                <TabsList>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="production">Production</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="mt-4"><SalesTable/></TabsContent>
                <TabsContent value="production" className="mt-4"><ProductionTable/></TabsContent>
                <TabsContent value="inventory" className="mt-4"><InventoryTable/></TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
  );
}
