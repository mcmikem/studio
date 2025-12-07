
"use client"

import type { User, Expense, Activity, Income, Testimony, Checkin } from "@/lib/types"
import {
  ArrowRight,
  Wallet,
  Camera,
  Wand,
  CheckCheck,
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Button } from "../ui/button"
import Link from "next/link"
import { formatDateSafe } from "@/lib/utils"
import { DashboardGrid } from "./dashboard-grid"
import { collection, query, orderBy, limit, Timestamp, where } from "firebase/firestore"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import { startOfDay } from "date-fns"
import { DashboardHeader } from "./dashboard-header"
import { QuickAddTask } from "./quick-add-task"


const DynamicApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
            notation: 'compact'
        }).format(value);
    }
    return new Intl.NumberFormat('en-UG', { 
        style: 'currency', 
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

function MediaOpportunities({ activities, isLoading }: { activities: Activity[] | null, isLoading: boolean }) {
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

function LatestTestimonies({ testimonies, isLoading }: { testimonies: Testimony[] | null, isLoading: boolean }) {
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

function BudgetHealth({ expenses, income }: { expenses: Expense[] | null, income: Income[] | null }) {

    const { totalIncome, totalExpenses, cashBalance } = useMemo(() => {
        if (!income || !expenses) return { totalIncome: 0, totalExpenses: 0, cashBalance: 0 };
        
        const allTimeIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const allTimeClearedExpenses = expenses.filter(e => e.status === 'Acknowledged' || e.status === 'Disbursed').reduce((sum, e) => sum + e.totalAmount, 0);

        return { 
            totalIncome: allTimeIncome, 
            totalExpenses: allTimeClearedExpenses,
            cashBalance: allTimeIncome - allTimeClearedExpenses
        };
    }, [income, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet /> Budget Health</CardTitle>
        <CardDescription>A real-time overview of the organization's cash flow.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Cash Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(cashBalance)}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardProps {
  profile: User;
}

export function MediaFinanceDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const allExpensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses } = useCollection<Expense>(allExpensesQuery, { listen: false });
  
  const allIncomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allIncome } = useCollection<Income>(allIncomeQuery, { listen: false });

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'), limit(10));
  }, [firestore]);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  
  const testimoniesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonies'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);
  const { data: testimonies, isLoading: isLoadingTestimonies } = useCollection<Testimony>(testimoniesQuery);
  
  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const checkinsQuery = useMemoFirebase((db) => {
    if(!db) return null;
    return query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);


  return (
      <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <QuickAddTask />
       <DashboardGrid className="mt-6 lg:grid-cols-2">
         <div className="lg:col-span-2">
            <BudgetHealth expenses={allExpenses} income={allIncome} />
         </div>
        <DynamicApprovalQueue />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        <MediaOpportunities activities={activities} isLoading={isLoadingActivities} />
        <LatestTestimonies testimonies={testimonies} isLoading={isLoadingTestimonies} />
      </DashboardGrid>
      </div>
  )
}
