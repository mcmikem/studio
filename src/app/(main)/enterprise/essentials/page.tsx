'use client';

import { Suspense, useMemo } from 'react';
import { Loader2, Package, DollarSign, List, ArrowLeft, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import type { Sale, Product } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { startOfMonth, format } from 'date-fns';

function StatCard({ title, value, icon: Icon, description }: { title: string; value: string; icon: React.ElementType, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    )
}


function EssentialsHubPage() {
    const firestore = useFirestore();

    const monthStart = useMemo(() => startOfMonth(new Date()), []);

    const salesQuery = useMemoFirebase((db) => 
        query(
            collection(db, 'sales'), 
            where('sale_date', '>=', format(monthStart, 'yyyy-MM-dd')),
            orderBy('sale_date', 'desc')
        )
    , [monthStart]);
    
    const recentSalesQuery = useMemoFirebase((db) => 
        query(
            collection(db, 'sales'),
            orderBy('createdAt', 'desc'),
            limit(5)
        )
    , []);

    const { data: monthlySales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: recentSales, isLoading: isLoadingRecent } = useCollection<Sale>(recentSalesQuery);
    
    const stats = useMemo(() => {
        if (!monthlySales) return { totalRevenue: 0, totalSales: 0 };
        const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.total_amount, 0);
        return {
            totalRevenue,
            totalSales: monthlySales.length,
        }
    }, [monthlySales]);

    const salesColumns: ColumnDef<Sale>[] = [
        {
            accessorKey: 'transaction_number',
            header: 'Transaction ID',
            cell: ({row}) => <div className="font-mono text-xs">{row.original.transaction_number}</div>
        },
        {
            accessorKey: 'sale_date',
            header: 'Date',
            cell: ({row}) => formatDateSafe(row.original.sale_date, 'dateOnly')
        },
        {
            accessorKey: 'total_amount',
            header: 'Amount',
            cell: ({row}) => formatCurrency(row.original.total_amount)
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                icon={Store}
                title="Omuto Essentials Dashboard"
                description="Manage production, sales, and inventory for the social enterprise."
            />
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Revenue (This Month)" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} />
                <StatCard title="Sales (This Month)" value={stats.totalSales.toString()} icon={ShoppingCart} />
                <StatCard title="Top Product" value="Liquid Soap" icon={TrendingUp} description="Placeholder" />
                <StatCard title="Low Stock Items" value="2" icon={Package} description="Placeholder" />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>The last 5 sales transactions recorded.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={salesColumns} data={recentSales || []} isLoading={isLoadingRecent} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2">
                        <Button asChild variant="outline"><Link href="/enterprise/essentials/sales">New Sale</Link></Button>
                        <Button asChild variant="outline"><Link href="/enterprise/essentials/products">Manage Products</Link></Button>
                        <Button asChild variant="outline" disabled><Link href="#">New Production Batch</Link></Button>
                    </CardContent>
                </Card>
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
