'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { User, Checkin, Checkout } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Clock, AlertTriangle, Signal } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, where, Timestamp, orderBy } from 'firebase/firestore';
import { subHours } from 'date-fns';

const ACTIVE_WINDOW_MINUTES = 18 * 60;

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
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedUserStatus, setSelectedUserStatus] = useState<any | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const teamStatus = useMemo(() => {
    if (!users.data || !checkins.data || !currentTime) return null;

    const uniqueGroups = Array.from(
      users.data.reduce((map, u) => {
        const key = `${u.name}|${u.role}`.toLowerCase();
        if (!map.has(key)) map.set(key, u);
        return map;
      }, new Map<string, User>()).values()
    );

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

    // To handle multiple IDs for the same name/role, we need a map from name|role to all associated IDs
    const groupToIds = users.data.reduce((map, u) => {
      const key = `${u.name}|${u.role}`.toLowerCase();
      const list = map.get(key) || [];
      list.push(u.id);
      map.set(key, list);
      return map;
    }, new Map<string, string[]>());

    return uniqueGroups.map((user) => {
      const key = `${user.name}|${user.role}`.toLowerCase();
      const ids = groupToIds.get(key) || [user.id];

      // Merge check-ins and check-outs for ALL account IDs in this group
      const allUserCheckins: Checkin[] = [];
      const allUserCheckouts: Checkout[] = [];
      
      ids.forEach(id => {
        allUserCheckins.push(...(byUserCheckins.get(id) || []));
        allUserCheckouts.push(...(byUserCheckouts.get(id) || []));
      });

      const userCheckins = allUserCheckins.sort((a, b) => (b.timestamp?.toDate?.()?.getTime() || 0) - (a.timestamp?.toDate?.()?.getTime() || 0));
      const userCheckouts = allUserCheckouts.sort((a, b) => (b.timestamp?.toDate?.()?.getTime() || 0) - (a.timestamp?.toDate?.()?.getTime() || 0));

      const latestCheckin = userCheckins[0];
      const latestCheckout = userCheckouts[0];
      const checkinDate = latestCheckin?.timestamp?.toDate?.();
      const checkoutDate = latestCheckout?.timestamp?.toDate?.();

      const minutesSinceCheckin = checkinDate ? Math.round((currentTime.getTime() - checkinDate.getTime()) / 60000) : null;
      const checkedOutAfterCheckin = Boolean(checkinDate && checkoutDate && checkoutDate > checkinDate);
      const checkedIn = Boolean(checkinDate && !checkedOutAfterCheckin && (minutesSinceCheckin ?? Infinity) <= ACTIVE_WINDOW_MINUTES);

      let currentTask: string | null = null;
      if (latestCheckin?.details && Array.isArray(latestCheckin.details.timeBlocks)) {
        for (const block of latestCheckin.details.timeBlocks) {
          if (block && typeof block.startTime === 'string' && typeof block.endTime === 'string') {
            try {
              const baseDate = startOfDay(currentTime);
              const startTime = parse(block.startTime, 'hh:mm a', baseDate);
              const endTime = parse(block.endTime, 'hh:mm a', baseDate);
              if (isValid(startTime) && isValid(endTime) && isWithinInterval(currentTime, { start: startTime, end: endTime })) {
                currentTask = block.description;
                break;
              }
            } catch {}
          }
        }
      }

      return {
        user,
        checkedIn,
        currentTask,
        primaryMission: latestCheckin?.primaryMission || null,
        checkinTime: checkinDate ? format(checkinDate, 'p') : null,
        checkoutTime: checkoutDate ? format(checkoutDate, 'p') : null,
        minutesSinceCheckin,
      };
    });
  }, [users, checkins, checkouts, currentTime]);

  const activeCount = teamStatus?.filter((s) => s.checkedIn).length || 0;

  return (
    <Card className="rounded-[2rem] border-lg border-omuto-navy/20 shadow-soft bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Signal className="h-5 w-5" /></div>
            <div>
              <CardTitle className="font-heading text-xl font-bold tracking-tight text-omuto-navy">Live Deployment</CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">Hybrid Active Status (check-in vs checkout)</CardDescription>
            </div>
          </div>
          <div className="px-3 py-1 bg-omuto-navy text-white rounded-full font-black text-[10px] uppercase tracking-widest">{activeCount} Active</div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {(isLoading || !teamStatus) ? (
          <div className="grid grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-14 rounded-2xl border-2 border-omuto-navy/10" />)}</div>
        ) : teamStatus.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-6">
            {teamStatus.map((status) => (
              <button key={status.user.id} onClick={() => setSelectedUserStatus(status)} className="flex flex-col items-center gap-2 group relative">
                <div className="relative">
                  <Avatar className={`h-14 w-14 border-md transition-all duration-300 group-hover:rotate-3 group-hover:shadow-comic-sm ${status.checkedIn ? 'border-primary' : 'border-omuto-navy/10 grayscale opacity-50'}`}>
                    <AvatarImage src={status.user.photoURL} />
                    <AvatarFallback className="bg-muted font-bold text-xs">{getInitials(status.user.name)}</AvatarFallback>
                  </Avatar>
                  {status.checkedIn && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-tight truncate w-full ${status.checkedIn ? 'text-omuto-navy' : 'text-omuto-navy/40'}`}>{status.user.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="Scanning Frequencies..." description="No team members located in current grid." className="min-h-0 py-10" />
        )}
      </CardContent>

      <Sheet open={!!selectedUserStatus} onOpenChange={() => setSelectedUserStatus(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-hidden">
          {selectedUserStatus && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 bg-omuto-navy text-white flex items-center flex-row gap-4 border-b-4 border-primary">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md -rotate-3">
                  <AvatarImage src={selectedUserStatus.user.photoURL} />
                  <AvatarFallback className="bg-white text-omuto-navy font-bold text-xl">{getInitials(selectedUserStatus.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-2xl font-bold italic uppercase tracking-tighter leading-none text-white">{selectedUserStatus.user.name}</SheetTitle>
                  <SheetDescription className="text-white/70">{selectedUserStatus.user.role}</SheetDescription>
                </div>
              </SheetHeader>
              <div className="p-6 space-y-6 bg-omuto-cream flex-grow">
                {selectedUserStatus.checkedIn ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-omuto-navy/10 rounded-xl">
                      <span className="font-bold text-xs uppercase tracking-widest">Active Since</span>
                      <span className="font-bold text-sm italic">{selectedUserStatus.checkinTime}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest"><Target className="h-4 w-4" /> Primary Mission</div>
                      <div className="p-4 bg-white border-2 border-omuto-navy/10 rounded-xl"><p className="font-medium text-lg leading-tight">{selectedUserStatus.primaryMission}</p></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-omuto-navy/70 font-bold uppercase text-[10px] tracking-widest"><Clock className="h-4 w-4" /> Current Focus</div>
                      <div className="p-4 bg-omuto-blue/20 border-2 border-omuto-blue/30 rounded-xl"><p className="font-medium italic text-md text-omuto-navy leading-tight">{selectedUserStatus.currentTask || 'Flexible / asynchronous work block'}</p></div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 bg-white border-2 border-omuto-navy/10 border-dashed rounded-2xl text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-omuto-red mb-3" />
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-2">Not currently active</h3>
                    <p className="text-sm text-omuto-navy/60">Checkout closes active status. Last checkout: {selectedUserStatus.checkoutTime || 'N/A'}.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
