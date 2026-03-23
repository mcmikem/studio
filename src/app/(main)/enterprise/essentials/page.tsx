
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { Loader2, Package, DollarSign, List, ArrowLeft, TrendingUp, ShoppingCart, Store, ClipboardList, Factory, Boxes, AlertCircle, ShoppingBag, History, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { type Product, type Sale, type ProductionBatch } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { startOfMonth, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getEnterpriseInsightsAction } from '@/actions/mutations';
import { callAIOfflineFirst, offlineEnterpriseAdvisor } from '@/lib/offline-ai';

function StatCard({ title, value, icon: Icon, description, trend, variant = 'default' }: { title: string; value: string; icon: React.ElementType, description?: string, trend?: string, variant?: 'default' | 'urgent' }) {
    return (
        <Card className={`bg-background border-lg shadow-comic-sm ${variant === 'urgent' ? 'border-omuto-red/30 bg-omuto-red/5' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${variant === 'urgent' ? 'bg-omuto-red/10' : 'bg-primary/10'}`}>
                    <Icon className={`h-4 w-4 ${variant === 'urgent' ? 'text-omuto-red' : 'text-primary'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-xl sm:text-2xl font-bold tracking-tight break-words ${variant === 'urgent' ? 'text-omuto-red' : ''}`}>{value}</div>
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

    const monthlyProductionQuery = useMemoFirebase((db) =>
        db ? query(
            collection(db, 'production-batches'),
            where('production_date', '>=', format(monthStart, 'yyyy-MM-dd')),
            orderBy('production_date', 'desc')
        ) : null
    , [monthStart]);

    const recentProductionQuery = useMemoFirebase((db) =>
        db ? query(
            collection(db, 'production-batches'),
            orderBy('createdAt', 'desc'),
            limit(5)
        ) : null
    , []);
    
    const productsQuery = useMemoFirebase((db) => db ? query(collection(db, 'products')) : null, []);
    // const productionQuery = useMemoFirebase((db) => db ? query(collection(db, 'production-batches'), orderBy('createdAt', 'desc'), limit(5)) : null, []);

    const { data: monthlySales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: recentSales, isLoading: isLoadingRecent } = useCollection<Sale>(recentSalesQuery);
    const { data: monthlyProduction, isLoading: isLoadingProduction } = useCollection<ProductionBatch>(monthlyProductionQuery);
    const { data: recentProduction, isLoading: isLoadingRecentProduction } = useCollection<ProductionBatch>(recentProductionQuery);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    
    const [insights, setInsights] = useState<any[]>([]);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);

    useEffect(() => {
        if (!monthlySales || !recentProduction || isInsightsLoading || insights.length > 0) return;

        const fetchInsights = async () => {
            setIsInsightsLoading(true);
            try {
                const aiInput = {
                    sales: monthlySales,
                    inventory: products || [],
                    production: monthlyProduction || []
                };
                const result = await callAIOfflineFirst(
                    () => getEnterpriseInsightsAction(aiInput),
                    () => offlineEnterpriseAdvisor(aiInput)
                );
                setInsights(result.insights || []);
            } catch (error) {
                console.error("Failed to fetch AI insights:", error);
            } finally {
                setIsInsightsLoading(false);
            }
        };

        fetchInsights();
    }, [monthlySales, monthlyProduction, recentProduction]);

    const stats = useMemo(() => {
        if (!monthlySales) return { totalRevenue: 0, totalSales: 0, topProduct: 'N/A', lowStockCount: 0, productionBatches: 0, productionCost: 0, profit: 0 };
        
        const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.total_amount, 0);

        const productSales: Record<string, number> = {};
        monthlySales.forEach((sale: Sale) => {
            sale.items.forEach((item) => {
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
        
        const lowStockCount = (products || []).filter(p => 
            p.current_stock_quantity !== undefined && 
            p.reorder_level !== undefined && 
            p.current_stock_quantity <= p.reorder_level
        ).length;

        const productionCost = (monthlyProduction || []).reduce((sum, batch) => sum + Number((batch as any).material_cost_total || 0), 0);
        const profit = totalRevenue - productionCost;

        return {
            totalRevenue,
            totalSales: monthlySales.length,
            topProduct,
            lowStockCount,
            productionBatches: monthlyProduction?.length || 0,
            productionCost,
            profit,
        }
    }, [monthlySales, monthlyProduction]);
    
    const isLoading = isLoadingSales || isLoadingRecent || isLoadingProduction;

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

    /*
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
    */

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                     <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-omuto-navy flex flex-wrap items-center gap-2 sm:gap-3 leading-tight">
                        <Store className="h-8 w-8 sm:h-10 sm:w-10 text-primary shrink-0" />
                        Omuto <span className="text-primary">Essentials</span> Hub
                    </h1>
                    <p className="text-muted-foreground font-bold mt-1 uppercase text-[11px] sm:text-xs tracking-[0.15em] sm:tracking-widest leading-relaxed max-w-xl break-words">
                        Centralized command center for manufacturing, sales performance, and high-integrity inventory management.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-lg shadow-comic-sm w-full md:w-auto">
                        <Link href="/enterprise"><ArrowLeft className="mr-2 h-4 w-4" /> Enterprise Hub</Link>
                    </Button>
                </div>
            </header>

            <Card className="border-primary/30 bg-primary/5 shadow-comic-sm">
                <CardHeader>
                    <CardTitle className="text-base">How the Essentials system works</CardTitle>
                    <CardDescription>
                        Add real product/material names, log production, record sales, and run inventory checks. The app automatically updates shared data so reports and dashboards stay aligned.
                    </CardDescription>
                </CardHeader>
            </Card>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Monthly Revenue" 
                    value={isLoading ? '...' : formatCurrency(stats.totalRevenue)} 
                    icon={DollarSign} 
                    trend="+12% from last month"
                />
                <StatCard 
                    title="Profit/Loss" 
                    value={isLoading ? '...' : formatCurrency(stats.profit)} 
                    icon={stats.profit >= 0 ? TrendingUp : AlertCircle} 
                    description={stats.profit >= 0 ? 'Revenue minus costs' : 'Operating at a loss'}
                    variant={stats.profit < 0 ? 'urgent' : 'default'}
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
                    variant={stats.lowStockCount > 0 ? 'urgent' : 'default'}
                />
                <StatCard 
                    title="Production Batches" 
                    value={isLoading ? '...' : stats.productionBatches.toString()} 
                    icon={Factory} 
                    description={`Material cost: ${formatCurrency(stats.productionCost)}`}
                />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="border-lg shadow-comic-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter">Recent Sales Activity</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live feed of revenue-generating transactions.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="font-black text-xs uppercase tracking-widest text-primary w-full sm:w-auto justify-center sm:justify-start">
                                <Link href="/enterprise/essentials/sales">View All <TrendingUp className="ml-2 h-3 w-3"/></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable 
                                columns={salesColumns} 
                                data={recentSales || []} 
                                isLoading={isLoadingRecent} 
                                renderMobileCard={(sale) => (
                                    <div className="p-4 border rounded-xl bg-background shadow-sm space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-muted-foreground">{formatDateSafe(sale.sale_date, 'dateOnly')}</span>
                                            <Badge variant={sale.status === 'completed' ? 'default' : 'outline'} className="text-[10px] uppercase font-black">
                                                {sale.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-omuto-navy">{sale.customer_name || 'Guest'}</span>
                                            <span className="font-bold text-primary">{formatCurrency(sale.total_amount)}</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-lg shadow-comic-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter">Production Tracker</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent production runs and linked cost capture.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="font-black text-xs uppercase tracking-widest text-primary w-full sm:w-auto justify-center sm:justify-start">
                                <Link href="/enterprise/essentials/production">Manage Batches <Factory className="ml-2 h-3 w-3"/></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4">
                            {isLoadingRecentProduction && <Skeleton className="h-20 w-full" />}
                            {!isLoadingRecentProduction && (!recentProduction || recentProduction.length === 0) && (
                                <p className="text-sm text-muted-foreground">No production batches recorded yet.</p>
                            )}
                            {recentProduction?.map((batch) => (
                                <div key={batch.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{batch.batch_number}</p>
                                        <p className="text-xs text-muted-foreground">{formatDateSafe(batch.production_date, 'dateOnly')} • Qty {batch.quantity_produced}</p>
                                    </div>
                                    <Badge variant="outline">{batch.status}</Badge>
                                </div>
                            ))}
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
                            <Link href="/enterprise/essentials/procurement">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><ShoppingBag className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">Restock Log</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Buy Raw Materials</p>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/adjustments">
                                <div className="p-3 bg-omuto-red/10 rounded-xl mr-4 group-hover:bg-omuto-red/20"><History className="h-6 w-6 text-omuto-red"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter text-omuto-red">Damages/Loss</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Adjust Inventory</p>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/inventory">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><Boxes className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">Stock Count</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Physical Audit</p>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-20 border-lg shadow-comic-sm rounded-3xl justify-start px-6 hover:bg-primary/5 group">
                            <Link href="/enterprise/essentials/products">
                                <div className="p-3 bg-primary/10 rounded-xl mr-4 group-hover:bg-primary/20"><ClipboardList className="h-6 w-6 text-primary"/></div>
                                <div className="text-left text-omuto-navy">
                                    <p className="font-black uppercase text-sm tracking-tighter">Manage List</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">SKUs & Pricing</p>
                                </div>
                            </Link>
                        </Button>
                    </div>

                    <Card className="bg-primary/10 border-lg border-primary/20 rounded-3xl p-6 mt-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="h-12 w-12 text-primary" />
                        </div>
                        <div className="flex gap-4 relative">
                            <div className="p-3 bg-primary rounded-2xl h-fit text-white">
                                <Sparkles className="h-6 w-6"/>
                            </div>
                            <div className="space-y-3 flex-grow">
                                <h4 className="font-black text-sm uppercase tracking-tighter text-primary">AI Enterprise Advisor</h4>
                                
                                {isInsightsLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ) : insights.length > 0 ? (
                                    <div className="space-y-4">
                                        {insights.map((insight, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-primary/70 tracking-widest leading-none mb-1">
                                                    {insight.title} • {insight.priority} Priority
                                                </p>
                                                <p className="text-xs font-bold text-omuto-navy leading-relaxed">
                                                    {insight.insight}
                                                </p>
                                                <div className="mt-2 p-2 bg-white/50 rounded-lg border border-primary/10">
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Actionable Step</p>
                                                    <p className="text-[11px] font-bold text-omuto-navy">{insight.actionableStep}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wide">
                                        Analyzing enterprise data... Insights will appear as soon as sales and production trends are identified.
                                    </p>
                                )}
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
