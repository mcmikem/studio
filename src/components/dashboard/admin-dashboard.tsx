
"use client"

import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useMemo } from "react"
import { Users, DollarSign, Clock, FileText, TrendingUp, Settings, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { DashboardSection, CompactStatCard } from "./dashboard-section"
import { LeaveRequestsWidget } from "./leave-requests-widget"
import { NotificationsWidget } from "./notifications-widget"
import { TeamDeployment } from "./team-deployment"
import { ApprovalQueue } from "./approval-queue"

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(50)) : null, [firestore]);
  const { data: expenses } = useCollection(expensesQuery);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(50)) : null, [firestore]);
  const { data: income } = useCollection(incomeQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), limit(50)) : null, [firestore]);
  const { data: users } = useCollection(usersQuery);

  const schoolsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sx-schools'), limit(50)) : null, [firestore]);
  const { data: schools } = useCollection(schoolsQuery);

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
  const totalSchools = schools?.length || 0;

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
          label="Schools" 
          value={totalSchools} 
          icon={Shield} 
          color="bg-purple-500"
          href="/school-xperience"
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
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left - Pending & Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Links */}
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

          {/* Pending Approvals */}
          {pendingExpenses.length > 0 && (
            <DashboardSection 
              title="Pending Approvals" 
              icon={AlertTriangle}
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

          {/* Approval Queue */}
          <ApprovalQueue />

          {/* Team Deployment */}
          <TeamDeployment />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Role Focus */}
          <Card className="bg-omuto-navy text-white">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase opacity-60 mb-1">Your Focus</p>
              <p className="text-sm font-semibold">
                System administration, user management, and operations oversight
              </p>
            </CardContent>
          </Card>

          {/* Pending Items Summary */}
          <DashboardSection 
            title="Pending Items" 
            icon={Clock} 
            badge={`${pendingCount}`}
            badgeColor={pendingCount > 0 ? 'red' : 'green'}
            defaultOpen={true}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-muted">
                <span className="text-sm">Pending Expenses</span>
                <span className="font-bold">{pendingCount}</span>
              </div>
            </div>
          </DashboardSection>

          {/* Leave Requests */}
          <LeaveRequestsWidget />

          {/* Notifications */}
          <NotificationsWidget />
        </div>
      </div>
    </div>
  )
}
