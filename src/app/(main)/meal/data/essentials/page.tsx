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
import type { ProductionBatch, Sale, InventoryCheck } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function ProductionTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'production-batches'), orderBy('production_date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<ProductionBatch>(queryRef);
    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
                {data?.map(p => (
                    <Card key={p.id}>
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-black uppercase text-omuto-navy">Batch #{p.batch_number}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold">DATE:</span>
                                <span className="font-black">{formatDateSafe(p.production_date, 'dateOnly')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold">PRODUCT:</span>
                                <span className="font-black">{p.productId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold">QUANTITY:</span>
                                <span className="font-black">{p.quantity_produced}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Date</TableHead><TableHead className="font-black uppercase text-[10px]">Product ID</TableHead><TableHead className="font-black uppercase text-[10px]">Batch #</TableHead><TableHead className="font-black uppercase text-[10px]">Quantity</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(p => <TableRow key={p.id}><TableCell>{formatDateSafe(p.production_date, 'dateOnly')}</TableCell><TableCell>{p.productId}</TableCell><TableCell>{p.batch_number}</TableCell><TableCell>{p.quantity_produced}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
function SalesTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'sales'), orderBy('sale_date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<Sale>(queryRef);
    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)}
                {data?.map(s => (
                    <Card key={s.id}>
                        <CardHeader className="py-3 px-4">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-black uppercase text-omuto-navy">{formatCurrency(s.total_amount)}</CardTitle>
                                <Badge variant="outline" className="text-[10px] font-black uppercase">{s.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-xs space-y-1">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground font-bold uppercase">DATE:</span>
                                <span className="font-black">{formatDateSafe(s.sale_date, 'dateOnly')}</span>
                            </div>
                            <div className="pt-2 border-t border-omuto-navy/5">
                                <span className="text-muted-foreground font-bold uppercase block mb-1">ITEMS:</span>
                                <p className="font-bold leading-tight">{s.items.map(item => `${item.product_name} (x${item.quantity})`).join(', ')}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Date</TableHead><TableHead className="font-black uppercase text-[10px]">Items</TableHead><TableHead className="font-black uppercase text-[10px]">Total</TableHead><TableHead className="font-black uppercase text-[10px]">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(s => (
                            <TableRow key={s.id}>
                                <TableCell>{formatDateSafe(s.sale_date, 'dateOnly')}</TableCell>
                                <TableCell>
                                    {s.items.map(item => `${item.product_name} (x${item.quantity})`).join(', ')}
                                </TableCell>
                                <TableCell>{formatCurrency(s.total_amount)}</TableCell>
                                <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
function InventoryTable() {
    const firestore = useFirestore();
    const queryRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'inventory-checks'), orderBy('date', 'desc')) : null, [firestore]);
    const { data, isLoading } = useCollection<InventoryCheck>(queryRef);
    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({length:3}).map((_,i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}
                {data?.map(i => (
                    <Card key={i.id}>
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-black uppercase text-omuto-navy">{i.productName}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold uppercase">DATE:</span>
                                <span className="font-black">{formatDateSafe(i.date, 'dateOnly')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-bold uppercase">STOCK COUNT:</span>
                                <span className="font-black">{i.countedQuantity}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader><TableRow><TableHead className="font-black uppercase text-[10px]">Date</TableHead><TableHead className="font-black uppercase text-[10px]">Product</TableHead><TableHead className="font-black uppercase text-[10px]">Physical Count</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length:3}).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow>)}
                        {data?.map(i => (
                            <TableRow key={i.id}>
                                <TableCell>{formatDateSafe(i.date, 'dateOnly')}</TableCell>
                                <TableCell>{i.productName}</TableCell>
                                <TableCell>{i.countedQuantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}


export default function EssentialsDataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
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
