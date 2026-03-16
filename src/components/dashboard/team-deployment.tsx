'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { User, Checkin, Checkout } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Clock, AlertTriangle, Signal, Coffee, Moon, Sun, Zap } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid, isBefore, isAfter } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, where, Timestamp, orderBy } from 'firebase/firestore';
import { subHours, differenceInMinutes } from 'date-fns';

const ACTIVE_WINDOW_MINUTES = 18 * 60;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;

function getTimeOfDayGreeting(): { emoji: string; message: string; icon: any } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: '🌙', message: 'Night owl mode', icon: Moon };
  if (hour < 12) return { emoji: '☀️', message: 'Morning session', icon: Sun };
  if (hour < 14) return { emoji: '🍽️', message: 'Lunch break', icon: Coffee };
  if (hour < 18) return { emoji: '⚡', message: 'Afternoon grind', icon: Zap };
  return { emoji: '🌙', message: 'Evening wind-down', icon: Moon };
}

function determineCurrentFocus(timeBlocks: any[], currentTime: Date): { task: string; status: 'working' | 'break' | 'flexible' } {
  if (!timeBlocks || !Array.isArray(timeBlocks) || timeBlocks.length === 0) {
    return { task: 'Flexible / async work', status: 'flexible' };
  }

  const now = new Date();
  const today = startOfDay(now);

  for (const block of timeBlocks) {
    if (!block || typeof block.startTime !== 'string' || typeof block.endTime !== 'string') continue;
    
    try {
      const startTime = parse(block.startTime.replace(/\s+(AM|PM)/i, ' $1').trim(), 'h:mm a', today);
      const endTime = parse(block.endTime.replace(/\s+(AM|PM)/i, ' $1').trim(), 'h:mm a', today);
      
      if (isValid(startTime) && isValid(endTime)) {
        if (isWithinInterval(now, { start: startTime, end: endTime })) {
          const isBreak = block.description?.toLowerCase().includes('break') || 
                        block.description?.toLowerCase().includes('lunch') ||
                        block.description?.toLowerCase().includes('flexible');
          return { 
            task: block.description || 'In scheduled block', 
            status: isBreak ? 'break' : 'working' 
          };
        }
      }
    } catch {}
  }

  return { task: 'Flexible / async work', status: 'flexible' };
}

function getUserStatus(checkin: Checkin | null, checkout: Checkout | null, currentTime: Date): { 
  status: 'active' | 'checked-out' | 'not-started'; 
  color: string;
  label: string;
  minutesAgo?: number;
} {
  if (!checkin) {
    return { status: 'not-started', color: 'gray', label: 'Not started' };
  }

  const checkinDate = checkin.timestamp?.toDate?.();
  const checkoutDate = checkout?.timestamp?.toDate?.();
  
  if (checkoutDate && checkoutDate > checkinDate) {
    return { status: 'checked-out', color: 'red', label: 'Checked out' };
  }

  if (checkinDate) {
    const minutesAgo = differenceInMinutes(currentTime, checkinDate);
    if (minutesAgo <= ACTIVE_WINDOW_MINUTES) {
      return { status: 'active', color: 'green', label: `Active ${minutesAgo}m ago` };
    }
  }

  return { status: 'checked-out', color: 'red', label: 'Session expired' };
}

export function TeamDeployment() {
  const firestore = useFirestore();

  const queries = useMemo(() => {
    if (!firestore) return null;
    const since = subHours(new Date(), 24);
    return {
      users: query(collection(firestore, 'users')),
      checkins: query(
        collection(firestore, 'checkins'), 
        where('timestamp', '>=', Timestamp.fromDate(since)),
        orderBy('timestamp', 'desc')
      ),
      checkouts: query(
        collection(firestore, 'checkouts'), 
        where('timestamp', '>=', Timestamp.fromDate(since)),
        orderBy('timestamp', 'desc')
      ),
    };
  }, [firestore]);

  const users = useCollection<User>(queries?.users);
  const checkins = useCollection<Checkin>(queries?.checkins);
  const checkouts = useCollection<Checkout>(queries?.checkouts);
  const isLoading = users.isLoading || checkins.isLoading || checkouts.isLoading;
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedUserStatus, setSelectedUserStatus] = useState<any | null>(null);
  const greeting = getTimeOfDayGreeting();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const teamStatus = useMemo(() => {
    if (!users.data || !checkins.data || !currentTime) return null;

    const byUserCheckins = new Map<string, Checkin[]>();
    const byUserCheckouts = new Map<string, Checkout[]>();

    checkins.data.forEach((c) => {
      const list = byUserCheckins.get(c.userId) || [];
      list.push(c);
      byUserCheckins.set(c.userId, list);
    });

    (checkouts.data || []).forEach((c) => {
      const list = byUserCheckouts.get(c.userId) || [];
      list.push(c);
      byUserCheckouts.set(c.userId, list);
    });

    const uniqueUsers = Array.from(
      new Map(users.data.map(u => [`${u.id}`, u])).values()
    );

    return uniqueUsers.map((user) => {
      const userCheckins = byUserCheckins.get(user.id) || [];
      const userCheckouts = byUserCheckouts.get(user.id) || [];
      
      const latestCheckin = userCheckins.sort((a, b) => 
        (b.timestamp?.toDate?.()?.getTime() || 0) - (a.timestamp?.toDate?.()?.getTime() || 0)
      )[0];
      
      const latestCheckout = userCheckouts.sort((a, b) => 
        (b.timestamp?.toDate?.()?.getTime() || 0) - (a.timestamp?.toDate?.()?.getTime() || 0)
      )[0];

      const status = getUserStatus(latestCheckin, latestCheckout, currentTime);
      const checkinDate = latestCheckin?.timestamp?.toDate?.();
      const minutesSinceCheckin = checkinDate ? differenceInMinutes(currentTime, checkinDate) : null;
      
      const focus = determineCurrentFocus(latestCheckin?.details?.timeBlocks, currentTime);

      return {
        user,
        status,
        focus,
        primaryMission: latestCheckin?.primaryMission || null,
        checkinTime: checkinDate ? format(checkinDate, 'h:mm a') : null,
        minutesSinceCheckin,
      };
    }).sort((a, b) => {
      if (a.status.status === 'active' && b.status.status !== 'active') return -1;
      if (b.status.status === 'active' && a.status.status !== 'active') return 1;
      if (a.status.status === 'not-started' && b.status.status === 'checked-out') return 1;
      return 0;
    });
  }, [users, checkins, checkouts, currentTime]);

  const activeCount = teamStatus?.filter(s => s.status.status === 'active').length || 0;
  const notStartedCount = teamStatus?.filter(s => s.status.status === 'not-started').length || 0;

  return (
    <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm bg-white overflow-hidden">
      <CardHeader className="bg-omuto-cream/50 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Signal className="h-5 w-5" /></div>
            <div>
              <CardTitle className="font-heading text-xl font-bold tracking-tight text-omuto-navy">Live Team Status</CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">
                {greeting.message} • {format(currentTime, 'h:mm a')}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-black text-[10px] uppercase">
              {activeCount} Active
            </div>
            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-black text-[10px] uppercase">
              {notStartedCount} Not Started
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {(isLoading || !teamStatus) ? (
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded-2xl" />)}</div>
        ) : teamStatus.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {teamStatus.map((member) => (
              <button 
                key={member.user.id} 
                onClick={() => setSelectedUserStatus(member)} 
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  <Avatar className={`h-16 w-16 border-2 transition-all duration-300 group-hover:scale-105 ${
                    member.status.status === 'active' 
                      ? 'border-green-500 shadow-lg shadow-green-100' 
                      : member.status.status === 'checked-out'
                        ? 'border-red-300 opacity-60'
                        : 'border-gray-300 grayscale opacity-50'
                  }`}>
                    <AvatarImage src={member.user.photoURL} />
                    <AvatarFallback className="bg-muted font-bold">{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  {member.status.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-green-500 rounded-full border-2 border-white">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold truncate w-full ${
                    member.status.status === 'active' ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {member.user.name.split(' ')[0]}
                  </p>
                  {member.status.status === 'active' && member.focus && (
                    <p className="text-[9px] text-gray-500 truncate w-full max-w-[80px]">
                      {member.focus.status === 'working' ? '💼' : member.focus.status === 'break' ? '☕' : '🎯'} {member.focus.task.split(' ').slice(0, 2).join(' ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No team members found" description="Team members will appear here once they have accounts." />
        )}
      </CardContent>

      <Sheet open={!!selectedUserStatus} onOpenChange={() => setSelectedUserStatus(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-hidden">
          {selectedUserStatus && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 bg-omuto-navy text-white flex items-center flex-row gap-4 border-b-4 border-primary">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                  <AvatarImage src={selectedUserStatus.user.photoURL} />
                  <AvatarFallback className="bg-white text-omuto-navy font-bold text-xl">{getInitials(selectedUserStatus.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-2xl font-bold italic uppercase tracking-tighter leading-none text-white">
                    {selectedUserStatus.user.name}
                  </SheetTitle>
                  <SheetDescription className="text-white/70">{selectedUserStatus.user.role}</SheetDescription>
                </div>
              </SheetHeader>
              <div className="p-6 space-y-4 flex-grow bg-omuto-cream">
                {/* Status Badge */}
                <div className={`flex items-center justify-center p-3 rounded-xl border-2 ${
                  selectedUserStatus.status.status === 'active' 
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : selectedUserStatus.status.status === 'checked-out'
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-gray-100 border-gray-400 text-gray-600'
                }`}>
                  {selectedUserStatus.status.status === 'active' ? (
                    <><Signal className="w-4 h-4 mr-2" /> Currently Active • {selectedUserStatus.status.label}</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 mr-2" /> {selectedUserStatus.status.label}</>
                  )}
                </div>

                {selectedUserStatus.status.status === 'active' && (
                  <>
                    {selectedUserStatus.checkinTime && (
                      <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
                        <span className="font-bold text-xs uppercase">Checked in at</span>
                        <span className="font-bold">{selectedUserStatus.checkinTime}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                        <Target className="h-4 w-4" /> Primary Mission
                      </div>
                      <div className="p-4 bg-white border rounded-xl">
                        <p className="font-medium text-lg leading-tight">{selectedUserStatus.primaryMission || 'No mission set'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-omuto-navy/70 font-bold text-[10px] uppercase tracking-widest">
                        <Clock className="h-4 w-4" /> Current Focus
                      </div>
                      <div className={`p-4 border rounded-xl ${
                        selectedUserStatus.focus.status === 'working' 
                          ? 'bg-blue-50 border-blue-300' 
                          : selectedUserStatus.focus.status === 'break'
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-gray-50 border-gray-300'
                      }`}>
                        <p className="font-medium italic text-omuto-navy">
                          {selectedUserStatus.focus.task}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
