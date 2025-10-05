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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';

type Activity = {
  id: string;
  title: string;
  userName: string;
  actualCost: number;
  totalValue: number;
  finalRoi: number;
  loggedAt: {
    toDate: () => Date;
  };
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(value);
};


export default function ActivityLogPage() {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'));
  }, [firestore]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Activity Log
        </h1>
        <p className="text-muted-foreground">
          A complete history of all field activities and their calculated ROI.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Actual Cost</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Final ROI</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                     <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{activity.userName}</TableCell>
                    <TableCell>{formatCurrency(activity.actualCost)}</TableCell>
                    <TableCell>{formatCurrency(activity.totalValue)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          activity.finalRoi >= 0
                            ? 'border-green-500 bg-green-500/10 text-green-500'
                            : 'border-red-500 bg-red-500/10 text-red-500'
                        }
                        variant="outline"
                      >
                        {activity.finalRoi.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activity.loggedAt ? formatDistanceToNow(activity.loggedAt.toDate(), { addSuffix: true }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            <History className="h-8 w-8" />
                            <span>No activities logged yet.</span>
                        </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
