'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Palmtree, CheckCircle2, XCircle, 
  Calendar, AlertCircle, Loader2, 
  Search, Filter, MoreHorizontal,
  ChevronRight, MessageSquare, Clock
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateLeaveStatusAction, createSystemAlert } from '@/actions/mutations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HRLeaveManagement() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const leaveQuery = useMemoFirebase((db) => query(collection(db, 'leave-requests'), orderBy('createdAt', 'desc')));
  const { data: requests, isLoading } = useCollection<any>(leaveQuery);

  const handleStatusUpdate = async (req: any, status: 'Approved' | 'Rejected') => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const result = await updateLeaveStatusAction(req.id, status, user.uid, user.displayName || 'Admin', rejectionReason);
      
      if (result.success) {
        toast({ title: `Leave ${status}`, description: `The request has been updated successfully.` });
        
        await createSystemAlert({
            type: 'hr',
            userId: req.userId,
            title: `Leave Request ${status}`,
            message: `Your ${req.type} leave request for ${req.days} days has been ${status.toLowerCase()}.`,
            link: '/self-service/leave'
        });

        if (status === 'Rejected') setShowRejectDialog(false);
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColors: any = {
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Rejected': 'bg-rose-50 text-rose-600 border-rose-100',
    'Cancelled': 'bg-muted/50 text-muted-foreground border-transparent'
  };

  const pending = requests?.filter((r: any) => r.status === 'Pending') || [];
  const history = requests?.filter((r: any) => r.status !== 'Pending') || [];

  const RequestItem = ({ req }: { req: any }) => (
    <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-omuto-navy/5 flex items-center justify-center font-bold text-omuto-navy text-sm border">
                {req.userName?.[0] || 'U'}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-base font-bold text-omuto-navy tracking-tight">{req.userName}</p>
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", statusColors[req.status])}>
                        {req.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span>{req.type} Leave</span>
                    <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                    <span>{req.days} Days · {formatDateSafe(req.startDate, 'dateOnly')} - {formatDateSafe(req.endDate, 'dateOnly')}</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3 text-right">
            {req.status === 'Pending' ? (
                <>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSelectedRequest(req); setShowRejectDialog(true); }}
                        className="h-8 rounded-lg font-bold uppercase tracking-wider text-[10px] text-rose-600 border-rose-100 hover:bg-rose-50"
                    >
                        Reject
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(req, 'Approved')}
                        className="h-8 rounded-lg font-bold uppercase tracking-wider text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        Approve
                    </Button>
                </>
            ) : (
                <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">Processed By</p>
                    <p className="text-xs font-bold text-omuto-navy">{req.approvedByName || 'System'}</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Leave Terminal"
        description="Review and manage team-wide time-off applications."
        icon={Palmtree}
      />

      <Tabs defaultValue="pending" className="w-full">
          <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-12 border">
                <TabsTrigger value="pending" className="rounded-lg px-6 font-bold uppercase tracking-wider text-[10px] h-full">
                    Pending ({pending.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg px-6 font-bold uppercase tracking-wider text-[10px] h-full">
                    History ({history.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input placeholder="Search Team..." className="h-10 pl-10 pr-4 rounded-xl border w-64 text-sm" />
                  </div>
              </div>
          </div>

            <TabsContent value="pending" className="mt-0">
                <Card className="border shadow-sm overflow-hidden bg-card">
                <CardContent className="p-0">
                    {isLoading ? (
                         <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                    ) : pending.length > 0 ? (
                        <div className="divide-y border-t">
                            {pending.map(req => <RequestItem key={req.id} req={req} />)}
                        </div>
                    ) : (
                         <div className="py-24 text-center border-t">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600/20 mx-auto mb-4" />
                            <p className="text-xs font-bold text-omuto-navy/40 uppercase tracking-widest">No pending applications.</p>
                        </div>
                    )}
                </CardContent>
              </Card>
          </TabsContent>

            <TabsContent value="history" className="mt-0">
                <Card className="border shadow-sm overflow-hidden bg-card">
                <CardContent className="p-0">
                    {history.length > 0 ? (
                        <div className="divide-y border-t">
                            {history.slice(0, 20).map(req => <RequestItem key={req.id} req={req} />)}
                        </div>
                    ) : (
                         <div className="py-24 text-center border-t">
                            <Clock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-xs font-bold text-omuto-navy/40 uppercase tracking-widest">History is empty.</p>
                        </div>
                    )}
                </CardContent>
              </Card>
          </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md border shadow-2xl rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-rose-50/50 border-b">
                  <DialogTitle className="font-bold text-rose-900">Decline Application</DialogTitle>
                  <DialogDescription className="text-xs text-rose-600/70">
                      Please provide a reason for rejecting this leave request.
                  </DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5">Reason for Rejection</Label>
                      <Textarea 
                        placeholder="e.g., Critical project deadline, staffing shortage..."
                        className="min-h-[100px] rounded-xl border font-medium text-sm"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                      />
                  </div>
              </div>
              <DialogFooter className="p-6 bg-muted/20 border-t flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="h-10 rounded-lg font-bold uppercase tracking-wider text-[10px] flex-1">Cancel</Button>
                  <Button 
                    onClick={() => handleStatusUpdate(selectedRequest, 'Rejected')}
                    className="h-10 rounded-lg font-bold uppercase tracking-wider text-[10px] bg-rose-600 hover:bg-rose-700 text-white flex-1"
                  >
                        Confirm Rejection
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
