
"use client"

import type { User } from "@/lib/types"
import {
  ArrowRight,
  Check,
  DollarSign,
  FolderKanban,
  Target,
  VenetianMask,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import {
  collection,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  doc,
} from "firebase/firestore"
import { useMemo } from "react"
import type { Activity, Expense } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
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
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { formatDateSafe } from "@/lib/utils"
import { DashboardGrid } from "./dashboard-grid"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { createAlert } from "@/ai/flows/create-alert-flow"

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const today = new Date()
const dateString = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(value)
}

function FinancialOverview() {
  const firestore = useFirestore()

  const startOfMonth = useMemo(() => {
    const now = new Date()
    return Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }, [])

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
      collection(firestore, "activities"),
      where("loggedAt", ">=", startOfMonth)
    )
  }, [firestore, startOfMonth])

  const { data: activities, isLoading } = useCollection<Activity>(
    activitiesQuery
  )

  const monthlyBudget = 2000000 // Mock budget for now

  const totalSpent = useMemo(() => {
    return (
      activities?.reduce((sum, activity) => sum + activity.actualCost, 0) || 0
    )
  }, [activities])

  const totalValue = useMemo(() => {
    return (
      activities?.reduce((sum, activity) => sum + activity.totalValue, 0) || 0
    )
  }, [activities])

  const remainingBudget = monthlyBudget - totalSpent

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign />
            Monthly Spending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-muted-foreground">
            of {formatCurrency(monthlyBudget)} spent
          </p>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Target />
            Value Generated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-muted-foreground">
            from this month's activities
          </p>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <VenetianMask />
            Remaining Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(remainingBudget)}
          </p>
          <p className="text-sm text-muted-foreground">for the rest of the month</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentQueue() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(
      collection(firestore, "expenses"),
      where("status", "==", "Approved"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [firestore])

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery)

  const handleMarkAsCleared = async (expense: Expense) => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    try {
        await updateDocumentNonBlocking(expenseRef, { status: 'Cleared' });
        toast({
          title: `Expense Cleared`,
          description: `The expense from ${expense.userName} has been marked as cleared.`,
        });
        
        if (expense.userId) {
            await createAlert({
                type: 'Info',
                message: `Your expense for '${expense.title}' of ${formatCurrency(expense.totalAmount)} has been cleared.`,
                priority: 'Low',
                action: `/management/expenses`,
            });
        }

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the expense status. Please try again.",
        });
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Queue</CardTitle>
        <CardDescription>Expenses approved by management and awaiting payment.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.userName}</TableCell>
                  <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleMarkAsCleared(expense)}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Cleared
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    The payment queue is empty.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        <Button asChild className="mt-4 w-full" variant="outline">
          <Link href="/management/expenses">
            View All Expense Reports <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function MediaFinanceDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(" ")[0] || "User"

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Here is your Media & Finance dashboard.
        </p>
      </header>
       <DashboardGrid
        headerContent={
           <Card>
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                A summary of this month's spending and value generation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FinancialOverview />
            </CardContent>
            </Card>
        }
        mainContent={
          <>
            <PaymentQueue />
             <Card>
              <CardHeader>
                <CardTitle>Media Asset Library</CardTitle>
                <CardDescription>
                  A central place for all photos, videos, and brand assets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full min-h-48">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Under Development</h3>
                  <p className="text-muted-foreground text-sm">
                    A searchable library for all media content is coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        }
        sidebarContent={
          <>
            <DailyActions />
            <TeamToday />
          </>
        }
      />
    </>
  )
}
