"use client"

import type { Expense, Activity, Income, Testimony } from "@/lib/types"
import {
  ArrowRight,
  Wallet,
  Camera,
  Wand,
  Video,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card"
import { useMemo, useState, useEffect } from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import { formatDateSafe } from "@/lib/utils"
import { DashboardGrid } from "./dashboard-grid"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"

const DynamicApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
});

const formatCurrency = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    if (safeValue >= 1000000) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
            notation: 'compact'
        }).format(safeValue);
    }
    return new Intl.NumberFormat('en-UG', { 
        style: 'currency', 
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(safeValue);
};

function MediaOpportunities() {
    const firestore = useFirestore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const thirtyDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    }, [mounted]);
    
    const queries = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'activities'), 
            where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
            orderBy('loggedAt', 'desc'),
            limit(100)
        );
    }, [firestore, thirtyDaysAgo]);

    const { data: activities, isLoading } = useCollection<Activity>(queries);
    const opportunities = useMemo(() => {
        if (!activities) return [];
        return activities.filter(act => act.indirectValue && act.indirectValue > 0);
    }, [activities]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera /> Media Opportunities</CardTitle>
                <CardDescription>
                    A feed of recent field activities logged with media content.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {isLoading && (
                        Array.from({ length: 2 }).map((_, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-9 w-28" />
                            </div>
                        ))
                    )}
                    {!isLoading && opportunities.length > 0 ? (
                        opportunities.map(act => (
                            <div key={act.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-md bg-muted">
                                <div>
                                    <p className="font-semibold">{act.title}</p>
                                    <p className="text-xs text-muted-foreground">Logged by {act.userName} - {formatDateSafe(act.loggedAt)}</p>
                                </div>
                                <Button asChild size="sm" className="mt-2 sm:mt-0">
                                    <Link href={`/impact-story?activityId=${act.id}`}>
                                        <Wand className="mr-2 h-4 w-4" />
                                        Generate Story
                                    </Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                             <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full min-h-32">
                                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="font-semibold">No Media Opportunities</h3>
                                <p className="text-muted-foreground text-sm">
                                    No recent activities were logged with the "Capture Content" multiplier.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function LatestTestimonies() {
    const firestore = useFirestore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const thirtyDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    }, [mounted]);
    
    const queries = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'testimonies'), 
            where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
    }, [firestore, thirtyDaysAgo]);

    const { data: testimonies, isLoading } = useCollection<Testimony>(queries);
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Video /> Latest Testimonies</CardTitle>
                <CardDescription>
                    Recently captured stories from the field.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-3">
                    {isLoading && (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))
                    )}
                    {!isLoading && testimonies && testimonies.length > 0 ? (
                        testimonies.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                                <div>
                                    <p className="font-semibold">{t.title}</p>
                                    <p className="text-xs text-muted-foreground">Captured by {t.userName}</p>
                                </div>
                                <Button asChild size="sm" variant="secondary">
                                    <Link href="/testimonies">
                                        View
                                    </Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                             <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full min-h-32">
                                <Video className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="font-semibold">No Testimonies</h3>
                                <p className="text-muted-foreground text-sm">
                                    Go to "Record Testimony" to capture the first story.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
             <CardFooter>
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/testimonies">View All Testimonies <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function BudgetHealth() {
    const firestore = useFirestore();
    
    const expensesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(1000));
    }, [firestore]);
    
    const incomeQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(1000));
    }, [firestore]);

    const { data: expenses } = useCollection<Expense>(expensesQuery);
    const { data: income } = useCollection<Income>(incomeQuery);

    const { totalIncome, totalExpenses, cashBalance } = useMemo(() => {
        if (!income || !expenses) return { totalIncome: 0, totalExpenses: 0, cashBalance: 0 };
        
        const allTimeIncome = income
            .filter(i => i.status === 'Approved')
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const allTimeClearedExpenses = expenses
            .filter(e => e.status === 'Acknowledged' || e.status === 'Disbursed')
            .reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

        return { 
            totalIncome: allTimeIncome, 
            totalExpenses: allTimeClearedExpenses,
            cashBalance: allTimeIncome - allTimeClearedExpenses
        };
    }, [income, expenses]);

  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const balanceHealth: 'green' | 'yellow' | 'red' = cashBalance < 0 ? 'red' : expenseRatio > 90 ? 'red' : expenseRatio > 70 ? 'yellow' : 'green';
  const healthColors = { green: 'bg-green-50 border-green-200 text-green-700', yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700', red: 'bg-red-50 border-red-200 text-red-700' };
  const healthDotColors = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet /> Budget Health</CardTitle>
            <CardDescription>A real-time overview of the organization's cash flow.</CardDescription>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black ${healthColors[balanceHealth]}`}>
            <span className={`w-2 h-2 rounded-full ${healthDotColors[balanceHealth]} ${balanceHealth === 'green' ? 'animate-pulse' : ''}`} />
            {balanceHealth === 'green' ? 'Healthy' : balanceHealth === 'yellow' ? 'Caution' : 'Critical'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border-2 text-center ${cashBalance < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <p className="text-sm font-medium text-muted-foreground">Cash Balance</p>
            <p className={`text-3xl font-bold ${cashBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(cashBalance)}</p>
            {cashBalance < 0 && <p className="text-[10px] text-red-500 font-bold mt-1">In deficit</p>}
        </div>
        <div className="p-4 bg-muted rounded-xl border border-omuto-navy/10 text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className={`p-4 rounded-xl border-2 text-center ${expenseRatio > 90 ? 'border-red-200 bg-red-50' : expenseRatio > 70 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <p className={`text-3xl font-bold ${expenseRatio > 90 ? 'text-red-600' : expenseRatio > 70 ? 'text-yellow-600' : 'text-green-600'}`}>{formatCurrency(totalExpenses)}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">{Math.round(expenseRatio)}% of income</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MediaFinanceDashboard({ profile }: DashboardProps) {

  return (
    <div className="flex flex-col gap-6">
       <DashboardHeader profile={profile} />
       <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-3">
            <BudgetHealth />
         </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <TeamPerformanceLeaderboard />
            <DynamicApprovalQueue />
        </div>
         <div className="lg:col-span-2 flex flex-col gap-6">
             <MediaOpportunities />
             <LatestTestimonies />
        </div>
      </DashboardGrid>
    </div>
  )
}
