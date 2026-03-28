"use client"

import type { User as UserProfileType } from "@/lib/types"
import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useMemo } from "react"
import { Users, DollarSign, Target, Clock, CheckCircle, FileText, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDateSafe, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  // Expenses
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(50)) : null, [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  // Income
  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(50)) : null, [firestore]);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  // Users
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users } = useCollection(usersQuery);

  // This month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthExpenses = useMemo(() => {
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        const created = e.createdAt?.toDate?.() || new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : Date.now());
        return created >= monthStart && e.status !== 'Rejected';
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  }, [expenses, monthStart]);

  const thisMonthIncome = useMemo(() => {
    if (!income) return 0;
    return income
      .filter(i => {
        const received = i.dateReceived?.toDate?.() || new Date(i.dateReceived?.seconds ? i.dateReceived.seconds * 1000 : Date.now());
        return received >= monthStart;
      })
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [income, monthStart]);

  const pendingExpenses = expenses?.filter(e => e.status === 'Pending').slice(0, 5) || [];
  const pendingCount = expenses?.filter(e => e.status === 'Pending').length || 0;
  const totalStaff = users?.length || 0;

  const statusColors: Record<string, string> = {
    Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
    Approved: 'border-blue-500 bg-blue-500/10 text-blue-600',
    Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-600',
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Staff</span>
            </div>
            <p className="text-2xl font-black mt-1">{totalStaff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Income (MTD)</span>
            </div>
            {incomeLoading ? <Skeleton className="h-8 mt-1" /> : (
              <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(thisMonthIncome, true)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Expenses (MTD)</span>
            </div>
            {expensesLoading ? <Skeleton className="h-8 mt-1" /> : (
              <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(thisMonthExpenses, true)}</p>
            )}
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingExpenses.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Pending Approvals ({pendingExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-white border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">{expense.userName} · {formatDateSafe(expense.date, 'dateOnly')}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                    <Button asChild size="sm" variant="ghost" className="h-10 sm:h-6 text-[10px] font-bold text-primary">
                      <Link href={`/finance/requisitions?id=${expense.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link href="/finance/requisitions?status=Pending">View All Pending</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button asChild className="h-auto py-4 bg-omuto-navy">
          <Link href="/finance/requisitions" className="flex flex-col items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold">Requisitions</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 bg-omuto-navy">
          <Link href="/finance/income" className="flex flex-col items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-bold">Income</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 bg-omuto-navy">
          <Link href="/hr/dashboard" className="flex flex-col items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-xs font-bold">HR</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 bg-omuto-navy">
          <Link href="/meal" className="flex flex-col items-center gap-2">
            <Target className="h-5 w-5" />
            <span className="text-xs font-bold">MEAL</span>
          </Link>
        </Button>
      </div>

      <RoleMissionCard profile={profile} />
    </div>
  )
}