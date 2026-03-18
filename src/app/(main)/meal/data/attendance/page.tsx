'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Calendar, User, Users, Clock } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AttendanceRecordsPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'attendance-records'), orderBy('createdAt', 'desc'), limit(500));
  }, [firestore]);

  const { data: records, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  const columns = [
    {
       header: 'Event / Session',
       accessorKey: 'eventName',
       cell: ({ row }: { row: any }) => (
         <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight">{row.original.eventName}</span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                <Calendar className="h-2 w-2" /> {formatDateSafe(row.original.date, 'dateOnly')}
            </div>
         </div>
       )
    },
    {
       header: 'Participant',
       accessorKey: 'participantName',
       cell: ({ row }: { row: any }) => (
         <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-primary/60" />
            <span className="text-sm font-black uppercase text-omuto-navy/80">{row.original.participantName}</span>
         </div>
       )
    },
    {
       header: 'Details',
       cell: ({ row }: { row: any }) => (
         <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{row.original.gender}</Badge>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.original.age} YRS</span>
         </div>
       )
    },
    {
       header: 'Logged By',
       accessorKey: 'userName',
       cell: ({ row }: { row: any }) => (
         <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
                {(row.original.userName || 'U')[0]}
            </div>
            <span>{row.original.userName || 'System'}</span>
         </div>
       )
    }
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
             <div className="p-3 bg-white border-lg border-primary/20 shadow-comic-sm rounded-2xl">
                <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="font-heading text-4xl font-black tracking-tight leading-none uppercase text-primary">
                    Attendance <span className="underline decoration-4 underline-offset-4">Records</span>
                </h1>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">Multi-Program Session Logs</p>
            </div>
        </div>
        <Button variant="outline" asChild>
            <Link href="/meal/attendance"><Users className="mr-2 h-4 w-4" />LOG NEW SESSION</Link>
        </Button>
      </header>

      <DataTable 
        columns={columns}
        data={records || []}
        isLoading={isLoading}
        currentUser={user}
        userProfile={profile}
        editHref={(r: AttendanceRecord) => `/meal/attendance?id=${r.id}`}
        deleteCollection="attendance-records"
      />
    </div>
  );
}
