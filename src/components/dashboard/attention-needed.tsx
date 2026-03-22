
"use client"

import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy, Timestamp } from 'firebase/firestore'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Clock,
  Users,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Flag,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type AttentionItem = {
  id: string
  type: 'expense' | 'deadline' | 'overdue_visit' | 'approval'
  urgency: 'critical' | 'warning' | 'info'
  title: string
  sub: string
  action: string
  href: string
  days: number
}

function ExpenseApprovals() {
  const firestore = useFirestore()
  const q = firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null
  const { data: expenses } = useCollection<any>(q)

  const urgent = useMemo(() => {
    if (!expenses) return []
    return expenses
      .filter((e) => e.status !== 'Approved' && e.status !== 'Rejected')
      .slice(0, 3)
      .map((e) => {
        const createdAt = e.createdAt instanceof Timestamp ? e.createdAt.toDate() : new Date(e.createdAt || Date.now())
        const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: e.id,
          type: 'expense' as const,
          urgency: days >= 7 ? 'critical' as const : days >= 3 ? 'warning' as const : 'info' as const,
          title: e.title || 'Expense',
          sub: `${e.userName} · UGX ${(e.totalAmount || 0).toLocaleString()}`,
          action: 'Review',
          href: '/management/expenses',
          days,
        }
      })
  }, [expenses])

  if (urgent.length === 0) return null

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Wallet className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black text-sm truncate">{urgent.length} Expense{urgent.length !== 1 ? 's' : ''} Pending Approval</p>
              <Link href="/management/expenses" className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline flex-shrink-0">
                Review <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {urgent.map((e) => (
              <p key={e.id} className="text-xs text-muted-foreground truncate">{e.sub}</p>
            ))}
            {urgent[0].days >= 3 && (
              <p className="text-[10px] font-black text-amber-600 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Oldest: {urgent[0].days}d ago
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingDeadlines() {
  const firestore = useFirestore()
  const q = firestore ? query(collection(firestore, 'proposals'), orderBy('createdAt', 'desc')) : null
  const { data: proposals } = useCollection<any>(q)

  const deadlines = useMemo(() => {
    if (!proposals) return []
    const now = new Date()
    const items: AttentionItem[] = []
    proposals.forEach((p) => {
      if (p.submissionDate) {
        const d = new Date(p.submissionDate)
        const days = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (days <= 14) {
          items.push({
            id: `${p.id}-sub`,
            type: 'deadline',
            urgency: days < 0 ? 'critical' : days <= 7 ? 'warning' : 'info',
            title: p.title || 'Proposal',
            sub: `Submission · ${days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}`,
            action: 'View',
            href: '/management/resources',
            days,
          })
        }
      }
    })
    return items.sort((a, b) => a.days - b.days).slice(0, 2)
  }, [proposals])

  if (deadlines.length === 0) return null

  const mostUrgent = deadlines[0]

  return (
    <Card className={`border-l-4 ${mostUrgent.urgency === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${mostUrgent.urgency === 'critical' ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <Flag className={`h-5 w-5 ${mostUrgent.urgency === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black text-sm truncate">{mostUrgent.title}</p>
              <Link href={mostUrgent.href} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline flex-shrink-0">
                View <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <p className={`text-xs font-bold ${mostUrgent.urgency === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
              {mostUrgent.sub}
            </p>
            {deadlines.length > 1 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">+{deadlines.length - 1} more approaching</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverdueVisits() {
  const firestore = useFirestore()
  const schoolsQ = firestore ? query(collection(firestore, 'sx-schools'), orderBy('schoolName')) : null
  const visitsQ = firestore ? query(collection(firestore, 'sx-visits'), orderBy('createdAt', 'desc')) : null
  const { data: schools } = useCollection<any>(schoolsQ)
  const { data: visits } = useCollection<any>(visitsQ)

  const overdue = useMemo(() => {
    if (!schools || !visits) return []
    const now = new Date()
    const overdue30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return schools.filter((s) => {
      const schoolVisits = visits.filter((v) => v.schoolId === s.id)
      if (schoolVisits.length === 0) return true
      const last = schoolVisits[0]
      const dateVal = last.date as any
      const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal)
      return d < overdue30
    }).slice(0, 3)
  }, [schools, visits])

  if (overdue.length === 0) return null

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-xl relative">
            <Users className="h-5 w-5 text-red-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {overdue.length}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black text-sm">{overdue.length} Schools Overdue 30+ Days</p>
              <Link href="/school-xperience/planner" className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline flex-shrink-0">
                Plan <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {overdue.map((s) => (
              <p key={s.id} className="text-xs text-muted-foreground truncate">{s.schoolName}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AttentionNeeded() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-omuto-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-omuto-red" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Needs Attention</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ExpenseApprovals />
        <UpcomingDeadlines />
        <OverdueVisits />
      </div>
    </div>
  )
}
