'use client';

import { useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Calendar, Loader2 } from 'lucide-react';
import type { Activity } from '@/lib/types';
import { formatDateSafe, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useUserProfile } from '@/hooks/use-user-profile';
import { canEdit, canDelete } from '@/lib/permissions';
import { ActivityReportForm } from '@/components/forms/activity-report-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Eye } from 'lucide-react';

export default function ActivityLogPage() {
  const [limitCount, setLimitCount] = useState(100);
  const parentRef = useRef<HTMLDivElement>(null);
  
  const { user: currentUser } = useUser();
  const { profile } = useUserProfile(currentUser);
  const { toast } = useToast();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  const activitiesQuery = useMemoFirebase((db) => {
    return query(collection(db, 'activities'), orderBy('loggedAt', 'desc'), limit(limitCount));
  }, [limitCount]);

  const { data: activitiesData, isLoading } = useCollection<Activity>(activitiesQuery);
  const activities = activitiesData || [];

  // Determine grid columns based on screen size (simplified for virtualization)
  // In a real app, you might use a useWindowSize hook. 
  // Here we'll virtualize rows assuming 3 columns for desktop, 2 for tablet, 1 for mobile.
  // For simplicity in this implementation, we'll treat it as a single column list for virtualization 
  // OR group them into rows. Grouping into rows is better for grid.
  
  const columns = 1; // Default to 1 for mobile/simple virtualization
  // To handle the grid properly with virtualization, we can either:
  // 1. Virtualize columns and rows (Table virtualization)
  // 2. Group items into rows manually
  
  // Let's use 1 column for the virtualizer but render the grid inside the virtual item if needed,
  // OR just keep it as a list for now to ensure stability, as the user specifically asked for "Virtualized Lists".
  
  const virtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated height of an activity card
    overscan: 5,
  });

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
       <PageHeader 
        icon={History}
        title="Activity Log (ROI)"
        description="A financial and data-driven log of all activities reported via the ROI Calculator."
      />
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col pt-6">
          <div 
            ref={parentRef}
            className="flex-1 overflow-auto px-6 pb-6"
          >
            {isLoading && activities.length === 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="pt-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const activity = activities[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        paddingBottom: '16px' // Gap replacement
                      }}
                    >
                      <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-1">
                            <span title={activity.title}>{activity.title}</span>
                          </CardTitle>
                          <CardDescription className="flex items-center justify-between">
                            <span className="truncate">by {activity.userName}</span>
                            <span className="flex items-center text-xs whitespace-nowrap ml-2">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDateSafe(activity.loggedAt, 'dateOnly')}
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="border border-omuto-navy/6 rounded-lg p-2 bg-transparent">
                              <p className="font-semibold text-sm lg:text-base text-omuto-navy">{formatCurrency(activity.actualCost)}</p>
                              <p className="text-[10px] uppercase tracking-wide text-omuto-navy/40 mt-0.5">Actual</p>
                            </div>
                             <div className="border border-omuto-navy/6 rounded-lg p-2 bg-transparent">
                              <p className="font-semibold text-sm lg:text-base text-omuto-navy">{formatCurrency(activity.totalValue)}</p>
                              <p className="text-[10px] uppercase tracking-wide text-omuto-navy/40 mt-0.5">Value</p>
                            </div>
                            <div className="flex flex-col justify-center">
                              <Badge
                                className={`text-sm lg:text-base font-semibold w-full justify-center h-full transition-colors ${
                                  activity.finalRoi >= 0
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-rose-200 bg-rose-50 text-rose-700'
                                }`}
                                variant="outline"
                              >
                                {activity.finalRoi.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-end gap-1 pt-2">
                             {canEdit(activity, currentUser) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingActivity(activity)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                            )}
                            
                            {canDelete(profile) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Log?</AlertDialogTitle>
                                            <AlertDialogDescription>Are you sure you want to delete this activity log? This cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={async () => {
                                                    try {
                                                        await deleteDocumentNonBlocking(doc(useFirestore()!, 'activities', activity.id));
                                                        toast({ title: "Deleted", description: "Activity log has been removed." });
                                                    } catch (e) {
                                                        toast({ variant: 'destructive', title: "Error", description: "Failed to delete log." });
                                                    }
                                                }}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
                !isLoading && (
                  <EmptyState 
                    icon={History}
                    title="No Activities Logged"
                    description="Activities logged via the ROI Calculator will appear here."
                  >
                    <Button asChild className="mt-4">
                        <Link href="/meal">Log First Activity</Link>
                    </Button>
                  </EmptyState>
                )
            )}

            {activities.length >= limitCount && (
              <div className="mt-8 flex justify-center pb-6">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setLimitCount((prev: number) => prev + 50)} 
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Load More Activities
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Update Activity Impact</DialogTitle>
                <DialogDescription>
                    Refine the data for "{editingActivity?.title}".
                </DialogDescription>
            </DialogHeader>
            {editingActivity && (
                <ActivityReportForm 
                    activity={editingActivity} 
                    onSuccess={() => setEditingActivity(null)} 
                />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
