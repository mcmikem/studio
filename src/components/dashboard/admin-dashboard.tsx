
"use client"

import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useMemo } from "react"
import { Users, DollarSign, Clock, FileText, TrendingUp, Settings, Shield } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDateSafe } from "@/lib/utils"
import { DashboardSection, CompactStatCard } from "./dashboard-section"

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(50)) : null, [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(50)) : null, [firestore]);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), limit(50)) : null, [firestore]);
  const { data: users } = useCollection(usersQuery);

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

  const pendingExpenses = expenses?.filter(e => e.status === 'Pending').slice(0, 3) || [];
  const pendingCount = expenses?.filter(e => e.status === 'Pending').length || 0;
  const totalStaff = users?.length || 0;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />

      {/* Stats - Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CompactStatCard 
          label="Staff" 
          value={totalStaff} 
          icon={Users} 
          color="bg-blue-500"
          href="/hr/dashboard"
        />
        <CompactStatCard 
          label="Income (MTD)" 
          value={formatCurrency(thisMonthIncome, true)} 
          icon={DollarSign} 
          color="bg-green-500"
          href="/finance/income"
        />
        <CompactStatCard 
          label="Expenses (MTD)" 
          value={formatCurrency(thisMonthExpenses, true)} 
          icon={TrendingUp} 
          color="bg-red-500"
          href="/finance/requisitions"
        />
        <CompactStatCard 
          label="Pending" 
          value={pendingCount} 
          icon={Clock} 
          color={pendingCount > 0 ? "bg-amber-500" : "bg-green-500"}
          href="/finance/requisitions?status=Pending"
        />
      </div>

      {/* Quick Links - Icon Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/finance/requisitions" className="flex flex-col items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-bold">Requisitions</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/finance/income" className="flex flex-col items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-bold">Income</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/hr/dashboard" className="flex flex-col items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-bold">HR</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/management/users" className="flex flex-col items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="text-xs font-bold">Settings</span>
          </Link>
        </Button>
      </div>

      {/* Pending Approvals - Collapsible */}
      {pendingExpenses.length > 0 && (
        <DashboardSection 
          title="Pending Approvals" 
          icon={Clock} 
          badge={`${pendingCount}`}
          badgeColor={pendingCount > 0 ? 'red' : 'green'}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {pendingExpenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{expense.title}</p>
                  <p className="text-xs text-muted-foreground">{expense.userName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                  <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                  <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
                    <Link href={`/finance/requisitions?id=${expense.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  )
}
