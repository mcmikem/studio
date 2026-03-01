
'use client';

import { Suspense, useMemo } from 'react';
import { Loader2, Package, DollarSign, List, ArrowLeft, TrendingUp, ShoppingCart, Store, ClipboardList, Factory, Boxes, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import type { Sale, Product, ProductionBatch } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { startOfMonth, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function StatCard({ title, value, icon: Icon, description, trend }: { title: string; value: string; icon: React.ElementType, description?: string, trend?: string }) {
    return (
        <Card className="bg-background border-lg shadow-comic-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {description && <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">{description}</p>}
                {trend && <p className="text-[10px] font-black text-green-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {trend}
                </p>}
            </CardContent>
        </Card>
    )
}


function EssentialsHubPage() {
    const firestore = useFirestore();

    const monthStart = useMemo(() => startOfMonth(new Date()), []);

    const salesQuery = useMemoFirebase((db) => 
        db ? query(
            collection(db, 'sales'), 
            where('sale_date', '>=', format(monthStart, 'yyyy-MM-dd')),
            orderBy('sale_date', 'desc')
        ) : null
    , [monthStart]);
    
    const recentSalesQuery = useMemoFirebase((db) => 
        db ? query(
            collection(db, 'sales'),
            orderBy('createdAt', 'desc'),
            limit(5)
        ) : null
    , []);

    const productsQuery = useMemoFirebase((db) => db ? query(collection(db, 'products')) : null, []);
    const productionQuery = useMemoFirebase((db) => db ? query(collection(db, 'production-batches'), orderBy('createdAt', 'desc'), limit(5)) : null, []);

    const { data: monthlySales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: recentSales, isLoading: isLoadingRecent } = useCollection<Sale>(recentSalesQuery);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const { data: recentProduction, isLoading: isLoadingProduction } = useCollection<ProductionBatch>(productionQuery);
    
    const stats = useMemo(() => {
        if (!monthlySales || !products) return { totalRevenue: 0, totalSales: 0, topProduct: 'N/A', lowStockCount: 0 };
        
        const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.total_amount, 0);

        const productSales: Record<string, number> = {};
        monthlySales.forEach(sale => {
            sale.items.forEach(item => {
                const productName = item.product_name || 'Unknown Product';
                if (productSales[productName]) {
                    productSales[productName] += item.quantity;
                } else {
                    productSales[productName] = item.quantity;
                }
            });
        });

        let topProduct = 'N/A';
        let maxQuantity = 0;
        for (const productName in productSales) {
            if (productSales[productName] > maxQuantity) {
                maxQuantity = productSales[productName];
                topProduct = productName;
            }
        }
        
        const lowStockCount = products.filter(p => 
            p.reorder_level !== undefined &&
            (p.current_stock_quantity !== undefined || p.quantity_on_hand !== undefined) &&
            ((p.current_stock_quantity || 0) <= p.reorder_level || (p.quantity_on_hand || 0) <= p.reorder_level)
        ).length;

        return {
            totalRevenue,
            totalSales: monthlySales.length,
            topProduct,
            lowStockCount
        }
    }, [monthlySales, products]);
    
    const isLoading = isLoadingSales || isLoadingRecent || isLoadingProducts;

    const salesColumns: ColumnDef<Sale>[] = [
        {
            accessorKey: 'sale_date',
            header: 'Date',
            cell: ({row}) => <span className="text-xs font-bold">{formatDateSafe(row.original.sale_date, 'dateOnly')}</span>
        },
        {
            accessorKey: 'customer_name',
            header: 'Customer',
            cell: ({row}) => <span className="text-xs">{row.original.customer_name || 'Guest'}</span>
        },
        {
            accessorKey: 'total_amount',
            header: 'Amount',
            cell: ({row}) => <span className="font-bold text-primary">{formatCurrency(row.original.total_amount)}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({row}) => (
                <Badge variant={row.original.status === 'completed' ? 'default' : 'outline'} className="text-[10px] uppercase font-black">
                    {row.original.status}
                </Badge>
            )
        }
    ];

    const productionColumns: ColumnDef<ProductionBatch>[] = [
        {
            accessorKey: 'production_date',
            header: 'Date',
            cell: ({row}) => <span className="text-xs font-bold">{formatDateSafe(row.original.production_date, 'dateOnly')}</span>
        },
        {
            accessorKey: 'batch_number',
            header: 'Batch #',
            cell: ({row}) => <span className="text-xs font-mono">{row.original.batch_number}</span>
        },
        {
            accessorKey: 'quantity_produced',
            header: 'Qty',
            cell: ({row}) => <span className="font-bold text-omuto-teal">{row.original.quantity_produced}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({row}) => (
                <Badge variant="outline" className="text-[10px] uppercase font-black">
                    {row.original.status}
                </Badge>
            )
        }
    ];

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h1 className="font-headline text-4xl font-bold tracking-tight text-omuto-navy flex items-center gap-3">
                        <Store className="h-10 w-10 text-primary" />
                        Omuto <span className="text-primary">Essentials</span> Hub
                    </h1>
                    <p className="text-muted-foreground font-bold mt-1 uppercase text-xs tracking-widest leading-relaxed max-w-xl">
                        Centralized command center for manufacturing, sales performance, and high-integrity inventory management.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-lg">
                        <Link href="/enterprise"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Enterprise</Link>
                    </Button>
                </div>
            </header>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Monthly Revenue" 
                    value={isLoading ? '...' : formatCurrency(stats.totalRevenue)} 
                    icon={DollarSign} 
                    trend="+12% from last month"
                />
                <StatCard 
                    title="Volume of Sales" 
                    value={isLoading ? '...' : stats.totalSales.toString()} 
                    icon={ShoppingCart} 
                    description="Total orders this month"
                />
                <StatCard 
                    title="Leading Product" 
                    value={isLoading ? '...' : stats.topProduct} 
                    icon={TrendingUp} 
                    description="Highest volume mover"
                />
                <StatCard 
                    title="Critical Stock" 
                    value={isLoading ? '...' : String(stats.lowStockCount)} 
                    icon={AlertCircle} 
                    description="Items below reorder point"
                />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="border-lg shadow-comic-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter">Recent Sales Activity</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live feed of revenue-generating transactions.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="font-black text-xs uppercase tracking-widest text-primary">
                                <Link href="/enterprise/essentials/sales">View All <TrendingUp className="ml-2 h-3 w-3"/></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={salesColumns} data={recentSales || []} isLoading={isLoadingRecent} />
                        </CardContent>
                    </Card>

                    <Card className="border-lg shadow-comic-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter text-omuto-teal">Production Queue</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent batches and manufacturing logs.</CardDescription>
                            </div>
                             <Button variant="ghost" size="sm" asChild className="font-black text-xs uppercase tracking-widest text-omuto-teal">
                                <Link href="/enterprise/essentials/production">View All <Factory className="ml-2 h-3 w-3"/></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={productionColumns} data={recentProduction || []} isLoading={isLoadingProduction} />
                        </CardContent>
                    </Card>
                </div>

                 <div className="space-y-6">
                    <h3 className="font-black uppercase text-xs tracking-[0.2em] text-muted-foreground pl-1">Operations Control</h3>
                    <div className="grid grid-cols-1 gap-4">
                         <Button asChild className="btn-omuto h-20 shadow-comic-lg rounded-3xl justify-start px-6">
                            <Link href="/enterprise/essentials/sales">
                                <div className="p-3 bg-white/20 rounded-xl mr-4"><ShoppingCart className="h-6 w-6"/></div>
                                <div className="text-left">
                                    <p className="font-black uppercase text-sm tracking-tighter">Record Sale</p>
                                    <p className="text-[10px] font-bold text-white/70">Point-of-Sale Entry</p>
                                </div>
                            </Link>
                        </Button>
                        
                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/production">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><Factory className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">New Batch</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Log Manufacturing</p>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/inventory">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><Boxes className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">Inventory</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Stock Check & Audit</p>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/products">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><ClipboardList className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">Product List</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">SKU & Price Control</p>
                                </div>
                            </Link>
                        </Button>
                    </div>

                    <Card className="bg-omuto-yellow/10 border-lg border-omuto-yellow/20 rounded-3xl p-6 mt-8">
                        <div className="flex gap-4">
                            <div className="p-3 bg-omuto-yellow rounded-2xl h-fit text-omuto-brown">
                                <AlertCircle className="h-6 w-6"/>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-sm uppercase tracking-tighter text-omuto-brown">System Intelligence</h4>
                                <p className="text-[10px] font-bold text-omuto-brown/70 leading-relaxed uppercase tracking-wide">
                                    High volume production in Sector B. Suggesting inventory replenishment for packaging materials within 48 hours.
                                </p>
                            </div>
                        </div>
                    </Card>
                 </div>
             </div>
        </div>
    )
}

export default function EssentialsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EssentialsHubPage />
        </Suspense>
    )
}
