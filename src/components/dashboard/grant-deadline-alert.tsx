'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Proposal } from '@/lib/types';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, Clock, CheckCircle2, PlusCircle, Calendar,
  ChevronRight, DollarSign, AlertCircle, TrendingUp, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DeadlineItem {
  id: string;
  title: string;
  partnerName: string;
  amountRequested: number;
  status: string;
  deadlineDate: Date;
  deadlineType: 'submission' | 'decision';
  daysRemaining: number;
  health: 'red' | 'amber' | 'green';
  hasProposal: boolean;
}

function formatCurrency(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M UGX`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K UGX`;
  return `${value.toLocaleString()} UGX`;
}

function parseDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Timestamp) return dateVal.toDate();
  if (dateVal instanceof Date) return dateVal;
  try { return parseISO(String(dateVal)); } catch { return null; }
}

function HealthBadge({ health, days }: { health: 'red' | 'amber' | 'green'; days: number }) {
  return (
    <span className={cn(
      'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
      health === 'red' && 'bg-red-50 text-red-600 border border-red-200',
      health === 'amber' && 'bg-amber-50 text-amber-600 border border-amber-200',
      health === 'green' && 'bg-green-50 text-green-600 border border-green-200',
    )}>
      {health === 'red' && <AlertTriangle className="h-3 w-3" />}
      {health === 'amber' && <Clock className="h-3 w-3" />}
      {health === 'green' && <CheckCircle2 className="h-3 w-3" />}
      {health === 'red' ? 'Urgent' : health === 'amber' ? `${days}d left` : 'On track'}
    </span>
  );
}

export function GrantDeadlineAlert() {
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const proposalsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'proposals'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: proposals, isLoading } = useCollection<Proposal>(proposalsQuery);

  const items = useMemo(() => {
    if (!currentDate) return [];
    return (proposals || []).map(p => {
      const submissionDate = parseDate(p.submissionDate);
      const decisionDate = parseDate(p.decisionDate);

      const deadlines: DeadlineItem[] = [];

      if (submissionDate) {
        const days = differenceInDays(submissionDate, currentDate);
        const health: 'red' | 'amber' | 'green' =
          days < 0 ? 'red' : days <= 14 ? 'amber' : 'green';
        deadlines.push({
          id: `${p.id}-sub`,
          title: p.title,
          partnerName: p.partnerName,
          amountRequested: p.amountRequested,
          status: p.status,
          deadlineDate: submissionDate,
          deadlineType: 'submission',
          daysRemaining: days,
          health,
          hasProposal: p.status !== 'Draft' && !!p.status,
        });
      }

      if (decisionDate) {
        const days = differenceInDays(decisionDate, currentDate);
        const health: 'red' | 'amber' | 'green' =
          days < 0 ? 'red' : days <= 14 ? 'amber' : 'green';
        deadlines.push({
          id: `${p.id}-dec`,
          title: p.title,
          partnerName: p.partnerName,
          amountRequested: p.amountRequested,
          status: p.status,
          deadlineDate: decisionDate,
          deadlineType: 'decision',
          daysRemaining: days,
          health,
          hasProposal: p.status !== 'Draft',
        });
      }

      return deadlines;
    }).flat().filter(item => item.daysRemaining <= 30);
  }, [proposals, currentDate]);

  const sorted = items.sort((a, b) => {
    if (a.health === 'red' && b.health !== 'red') return -1;
    if (b.health === 'red' && a.health !== 'red') return 1;
    return a.daysRemaining - b.daysRemaining;
  });

  const red = sorted.filter(i => i.health === 'red');
  const amber = sorted.filter(i => i.health === 'amber');
  const green = sorted.filter(i => i.health === 'green');

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Grant Deadline Tracker
              </CardTitle>
              <CardDescription>No proposals with upcoming deadlines in the next 30 days.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No upcoming deadlines</p>
            <p className="text-xs mt-1">Add proposals with submission or decision dates to track them here.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/management/resources">
                Go to Resource Mobilization
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Grant Deadline Tracker
            </CardTitle>
            <CardDescription>
              {red.length > 0 && (
                <span className="text-red-600 font-bold">{red.length} urgent · </span>
              )}
              {amber.length > 0 && (
                <span className="text-amber-600 font-bold">{amber.length} approaching · </span>
              )}
              {green.length > 0 && (
                <span className="text-green-600 font-bold">{green.length} on track · </span>
              )}
              {sorted.length} total deadline{sorted.length !== 1 ? 's' : ''} in next 30 days
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="flex-shrink-0">
            <Link href="/management/resources">
              <PlusCircle className="h-3 w-3 mr-1" />
              Add Proposal
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {red.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Needs immediate action</span>
            </div>
            <div className="space-y-2">
              {red.map(item => (
                <DeadlineRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {amber.length > 0 && (
          <div>
            {red.length > 0 && <div className="border-t border-dashed my-3" />}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Approaching — prepare now</span>
            </div>
            <div className="space-y-2">
              {amber.map(item => (
                <DeadlineRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {green.length > 0 && (
          <div>
            {(red.length > 0 || amber.length > 0) && <div className="border-t border-dashed my-3" />}
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600">On track</span>
            </div>
            <div className="space-y-2">
              {green.map(item => (
                <DeadlineRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeadlineRow({ item }: { item: DeadlineItem }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const addToCalendar = async () => {
    if (!firestore) return;
    const eventsCollection = collection(firestore, 'events');
    const title = `${item.deadlineType === 'submission' ? '📤' : '📋'} Grant: ${item.title} (${item.partnerName})`;
    await addDocumentNonBlocking(eventsCollection, {
      title,
      date: Timestamp.fromDate(item.deadlineDate),
      category: 'Deadlines',
      location: item.partnerName,
      responsible: 'Resource Mobilization',
      createdAt: serverTimestamp(),
    });
    toast({
      title: 'Added to Calendar',
      description: `${item.title} deadline added to calendar on ${format(item.deadlineDate, 'MMM d')}.`,
    });
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30',
      item.health === 'red' && 'bg-red-50/50 border-red-200',
      item.health === 'amber' && 'bg-amber-50/50 border-amber-200',
      item.health === 'green' && 'bg-green-50/30 border-green-200',
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[13px] text-omuto-navy truncate">{item.title}</p>
          <HealthBadge health={item.health} days={item.daysRemaining} />
          {item.status === 'Draft' && (
            <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="font-semibold">{item.partnerName}</span>
          <span className="flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(item.amountRequested)}
          </span>
          <span className={cn(
            'uppercase font-black tracking-wider',
            item.deadlineType === 'submission' ? 'text-blue-600' : 'text-purple-600'
          )}>
            {item.deadlineType === 'submission' ? 'Submit' : 'Decision'}:{' '}
            {format(item.deadlineDate, 'MMM d')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" className="h-10 sm:h-7 text-[11px] font-bold text-muted-foreground hover:text-omuto-navy" onClick={addToCalendar}>
          <Calendar className="h-3 w-3 mr-0.5" />
          Add to Calendar
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-10 sm:h-7 text-[11px] font-bold">
          <Link href="/management/resources">
            {item.status === 'Draft' ? 'Start Draft' : 'Update'}
            <ChevronRight className="ml-0.5 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function GrantDeadlineBanner() {
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const proposalsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'proposals'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: proposals } = useCollection<Proposal>(proposalsQuery);

  const urgent = useMemo(() => {
    if (!currentDate) return [];
    return (proposals || []).map(p => {
      const submissionDate = parseDate(p.submissionDate);
      const decisionDate = parseDate(p.decisionDate);

      if (submissionDate && differenceInDays(submissionDate, currentDate) <= 14) {
        return { title: p.title, days: differenceInDays(submissionDate, currentDate), type: 'submission' as const, status: p.status };
      }
      if (decisionDate && differenceInDays(decisionDate, currentDate) <= 14) {
        return { title: p.title, days: differenceInDays(decisionDate, currentDate), type: 'decision' as const, status: p.status };
      }
      return null;
    }).filter(Boolean);
  }, [proposals, currentDate]);

  if (!currentDate || urgent.length === 0) return null;

  return (
    <Link href="/management/resources" className="block">
      <div className={cn(
        'rounded-xl border p-3 flex items-center gap-3 hover:shadow-md transition-shadow',
        urgent.some(u => u && u.days <= 0)
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      )}>
        <AlertCircle className={cn(
          'h-5 w-5 flex-shrink-0',
          urgent.some(u => u && u.days <= 0) ? 'text-red-500' : 'text-amber-500'
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-omuto-navy">
            {urgent.length} grant deadline{urgent.length > 1 ? 's' : ''} approaching
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {urgent.slice(0, 2).map(u => u?.title).join(', ')}{urgent.length > 2 ? ` +${urgent.length - 2} more` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
          View <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
