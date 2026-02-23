
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Clock, AlertTriangle, ArrowUpRight, Signal } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '../ui/button';


interface TeamDeploymentProps {
    users: User[] | null;
    checkins: Checkin[] | null;
    isLoading: boolean;
}

export function TeamDeployment({ users, checkins, isLoading }: TeamDeploymentProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedUserStatus, setSelectedUserStatus] = useState<any | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const teamStatus = useMemo(() => {
    if (!users || !checkins || !currentTime) {
      return null;
    }
    
    const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());
    const checkinMap = new Map(checkins.map(c => [c.userId, c]));
    
    return uniqueUsers.map(user => {
      const userCheckin = checkinMap.get(user.id);
      let currentTask: string | null = null;
      let checkinTime: string | null = null;
      let primaryMission: string | null = null;
      
      if (userCheckin) {
        checkinTime = userCheckin.timestamp ? format(userCheckin.timestamp.toDate(), 'p') : null;
        primaryMission = userCheckin.primaryMission;
        
        if (userCheckin.details && Array.isArray(userCheckin.details.timeBlocks)) {
          for (const block of userCheckin.details.timeBlocks) {
            if (block && typeof block.startTime === 'string' && typeof block.endTime === 'string') {
              try {
                const now = currentTime;
                const baseDate = startOfDay(now);
                const startTime = parse(block.startTime, 'hh:mm a', baseDate);
                const endTime = parse(block.endTime, 'hh:mm a', baseDate);
                if (isValid(startTime) && isValid(endTime) && isWithinInterval(now, { start: startTime, end: endTime })) {
                  currentTask = block.description;
                  break;
                }
              } catch (e) {}
            }
          }
        }
      }
      
      return { user, checkedIn: !!userCheckin, currentTask, primaryMission, checkinTime };
    });
  }, [users, checkins, currentTime]);

  const activeCount = teamStatus?.filter(s => s.checkedIn).length || 0;

  return (
    <Card className="rounded-[2rem] border-lg border-omuto-navy/20 shadow-soft bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Signal className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="font-heading text-xl font-bold tracking-tight text-omuto-navy">Live Deployment</CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">HQ Personnel Tracking</CardDescription>
                </div>
            </div>
            <div className="px-3 py-1 bg-omuto-navy text-white rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse">
                {activeCount} Active
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {(isLoading || !teamStatus) ? (
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-14 rounded-2xl border-2 border-omuto-navy/10" />)}
          </div>
        ) : teamStatus.length > 0 ? (
           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-6">
            {teamStatus.map((status) => {
                return (
                    <button key={status.user.id} onClick={() => setSelectedUserStatus(status)} className="flex flex-col items-center gap-2 group relative">
                        <div className="relative">
                            <Avatar className={`h-14 w-14 border-md transition-all duration-300 group-hover:rotate-3 group-hover:shadow-comic-sm ${status.checkedIn ? 'border-primary' : 'border-omuto-navy/10 grayscale opacity-40'}`}>
                                <AvatarImage src={status.user.photoURL} />
                                <AvatarFallback className="bg-muted font-bold text-xs">{getInitials(status.user.name)}</AvatarFallback>
                            </Avatar>
                            {status.checkedIn && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-tight truncate w-full ${status.checkedIn ? 'text-omuto-navy' : 'text-omuto-navy/30'}`}>
                            {status.user.name.split(' ')[0]}
                        </p>
                    </button>
                )
            })}
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
                                <div className="flex items-center justify-between p-4 bg-white border-2 border-omuto-navy/10 rounded-xl shadow-soft">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><Signal className="h-5 w-5" /></div>
                                        <span className="font-bold text-xs uppercase tracking-widest">Active Link</span>
                                    </div>
                                    <span className="font-bold text-sm italic">{selectedUserStatus.checkinTime}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                                        <Target className="h-4 w-4" /> Primary Mission Today
                                    </div>
                                    <div className="p-4 bg-white border-2 border-omuto-navy/10 rounded-xl shadow-soft relative group overflow-hidden">
                                        <p className="font-medium text-lg leading-tight relative z-10">{selectedUserStatus.primaryMission}</p>
                                    </div>
                                </div>

                                 <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-omuto-navy/70 font-bold uppercase text-[10px] tracking-widest">
                                        <Clock className="h-4 w-4" /> Real-time Focus
                                    </div>
                                    <div className="p-4 bg-omuto-blue/20 border-2 border-omuto-blue/30 rounded-xl shadow-soft">
                                        <p className="font-medium italic text-md text-omuto-navy leading-tight">
                                            {selectedUserStatus.currentTask || "In Transition / Field Commute"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 bg-white border-2 border-omuto-navy/10 border-dashed rounded-2xl text-center">
                                <AlertTriangle className="mx-auto h-12 w-12 text-omuto-red mb-4" />
                                <h3 className="text-lg font-bold uppercase italic tracking-tighter mb-2">Comms Blackout</h3>
                                <p className="text-sm font-medium text-omuto-navy/50 uppercase leading-relaxed max-w-[200px] mx-auto">This member has not established a frequency (Check-in) yet today.</p>
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
