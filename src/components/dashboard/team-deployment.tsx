
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Clock, AlertTriangle, ArrowUpRight, Signal } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

type TeamStatus = {
  user: User;
  checkedIn: boolean;
  currentTask: string | null;
  primaryMission: string | null;
  checkinTime: string | null;
};

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

interface TeamDeploymentProps {
    users: User[] | null;
    checkins: Checkin[] | null;
    isLoading: boolean;
}

export function TeamDeployment({ users, checkins, isLoading }: TeamDeploymentProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedUserStatus, setSelectedUserStatus] = useState<TeamStatus | null>(null);

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
    <Card className="rounded-[2.5rem] border-4 border-omuto-navy shadow-comic bg-white overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-4 border-omuto-navy/10 pb-6 pt-8">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl shadow-comic-sm">
                    <Signal className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Live Deployment</CardTitle>
            </div>
            <div className="px-3 py-1 bg-omuto-navy text-white rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse">
                {activeCount} Active
            </div>
        </div>
        <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest">Real-time HQ Personnel Tracking</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
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
                            <Avatar className={`h-14 w-14 border-[3px] transition-all duration-300 group-hover:rotate-3 group-hover:shadow-comic-sm ${status.checkedIn ? 'border-omuto-red' : 'border-omuto-navy/10 grayscale opacity-40'}`}>
                                <AvatarImage src={status.user.photoURL} />
                                <AvatarFallback className="bg-muted font-black text-xs">{getInitials(status.user.name)}</AvatarFallback>
                            </Avatar>
                            {status.checkedIn && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            )}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-tight truncate w-full ${status.checkedIn ? 'text-omuto-navy' : 'text-omuto-navy/30'}`}>
                            {status.user.name.split(' ')[0]}
                        </p>
                        {status.checkedIn && (
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-omuto-navy text-white text-[8px] font-black px-2 py-0.5 rounded shadow-comic-sm z-10 uppercase">
                                View Mission
                            </div>
                        )}
                    </button>
                )
            })}
           </div>
        ) : (
            <EmptyState icon={Users} title="Scanning Frequencies..." description="No team members located in current grid." className="min-h-0 py-10" />
        )}
      </CardContent>

      <Dialog open={!!selectedUserStatus} onOpenChange={() => setSelectedUserStatus(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-4 border-omuto-navy p-0 overflow-hidden shadow-comic-lg">
            {selectedUserStatus && (
                 <div className="flex flex-col">
                    <div className="p-8 bg-omuto-navy text-white flex items-center gap-6 border-b-4 border-omuto-red">
                        <Avatar className="h-20 w-20 border-4 border-white shadow-comic-sm -rotate-3">
                            <AvatarImage src={selectedUserStatus.user.photoURL} />
                            <AvatarFallback className="bg-white text-omuto-navy font-black text-xl">{getInitials(selectedUserStatus.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Personnel Detail</p>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">{selectedUserStatus.user.name}</h2>
                            <Badge className="bg-omuto-red text-white border-none font-black text-[10px] uppercase tracking-widest">{selectedUserStatus.user.role}</Badge>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-omuto-cream">
                        {selectedUserStatus.checkedIn ? (
                            <>
                                <div className="flex items-center justify-between p-4 bg-white border-[3px] border-omuto-navy rounded-2xl shadow-comic-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><Signal className="h-5 w-5" /></div>
                                        <span className="font-black text-xs uppercase tracking-widest">Active Link</span>
                                    </div>
                                    <span className="font-black text-sm italic">{selectedUserStatus.checkinTime}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                        <Target className="h-4 w-4" /> Primary Mission Today
                                    </div>
                                    <div className="p-6 bg-white border-[3px] border-omuto-navy rounded-3xl shadow-comic-sm relative group overflow-hidden">
                                        <p className="font-bold text-lg leading-tight relative z-10">{selectedUserStatus.primaryMission}</p>
                                        <Target className="absolute -bottom-4 -right-4 h-20 w-20 opacity-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                </div>

                                 <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-omuto-navy font-black uppercase text-[10px] tracking-widest">
                                        <Clock className="h-4 w-4" /> Real-time Focus
                                    </div>
                                    <div className="p-6 bg-omuto-blue/20 border-[3px] border-omuto-navy rounded-3xl shadow-comic-sm">
                                        <p className="font-black italic text-md text-omuto-navy leading-tight uppercase tracking-tighter">
                                            {selectedUserStatus.currentTask || "In Transition / Field Commute"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 bg-white border-[3px] border-omuto-navy border-dashed rounded-[2.5rem] text-center">
                                <AlertTriangle className="mx-auto h-12 w-12 text-omuto-red mb-4" />
                                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Comms Blackout</h3>
                                <p className="text-sm font-bold text-omuto-navy/50 uppercase leading-relaxed max-w-[200px] mx-auto">This member has not established a frequency (Check-in) yet today.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
