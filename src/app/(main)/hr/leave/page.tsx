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
      const result = await updateLeaveStatusAction(req.id, status, user.uid, user.displayName || 'Admin');
      
      if (result.success) {
        toast({ title: `Leave ${status}`, description: `The request has been updated successfully.` });
        
        // Notify the user
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
    'Pending': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'Approved': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    'Rejected': 'bg-rose-500/10 text-rose-600 border-rose-200',
    'Cancelled': 'bg-muted text-muted-foreground border-transparent'
  };

  const pending = requests?.filter((r: any) => r.status === 'Pending') || [];
  const history = requests?.filter((r: any) => r.status !== 'Pending') || [];

  const RequestItem = ({ req }: { req: any }) => (
    <div className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors">
        <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-omuto-navy/5 flex items-center justify-center font-black text-omuto-navy text-sm border-2 border-omuto-navy/10">
                {req.userName?.[0] || 'U'}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-lg font-black text-omuto-navy tracking-tight uppercase">{req.userName}</p>
                    <Badge variant="outline" className={statusColors[req.status]}>
                        {req.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>{req.type} Leave</span>
                    <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                    <span>{req.days} Days ({formatDateSafe(req.startDate, 'dateOnly')} - {formatDateSafe(req.endDate, 'dateOnly')})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic max-w-md line-clamp-1">"{req.reason}"</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3 text-right">
            {req.status === 'Pending' ? (
                <>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSelectedRequest(req); setShowRejectDialog(true); }}
                        className="h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                        Reject
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(req, 'Approved')}
                        className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    >
                        Approve
                    </Button>
                </>
            ) : (
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Processed By</p>
                    <p className="text-xs font-black text-omuto-navy uppercase">{req.approvedByName || 'System'}</p>
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
              <TabsList className="bg-omuto-navy/5 p-1 rounded-2xl h-14">
                <TabsTrigger value="pending" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-omuto-navy data-[state=active]:shadow-md h-full">
                    Pending ({pending.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-omuto-navy data-[state=active]:shadow-md h-full">
                    History ({history.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input placeholder="Search Team..." className="h-14 pl-12 pr-6 rounded-2xl border-2 w-64 font-bold text-omuto-navy" />
                  </div>
              </div>
          </div>

          <TabsContent value="pending" className="mt-0">
              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                         <div className="p-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
                    ) : pending.length > 0 ? (
                        <div className="divide-y divide-omuto-navy/5">
                            {pending.map(req => <RequestItem key={req.id} req={req} />)}
                        </div>
                    ) : (
                         <div className="py-24 text-center">
                            <CheckCircle2 className="h-16 w-16 text-emerald-600/20 mx-auto mb-4" />
                            <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No pending applications at this time.</p>
                        </div>
                    )}
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
               <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    {history.length > 0 ? (
                        <div className="divide-y divide-omuto-navy/5">
                            {history.slice(0, 20).map(req => <RequestItem key={req.id} req={req} />)}
                        </div>
                    ) : (
                         <div className="py-24 text-center">
                            <Clock className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">History is empty.</p>
                        </div>
                    )}
                </CardContent>
              </Card>
          </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
              <DialogHeader className="p-8 bg-rose-50 border-b">
                  <DialogTitle className="font-black uppercase tracking-tight text-rose-900">Decline Application</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-wider text-rose-600/60">
                      Please provide a reason for rejecting this leave request.
                  </DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Reason for Rejection</Label>
                      <Textarea 
                        placeholder="e.g., Critical project deadline, staffing shortage..."
                        className="min-h-[120px] rounded-2xl border-2 font-medium"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                      />
                  </div>
              </div>
              <DialogFooter className="p-8 bg-muted/30 border-t flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs">Cancel</Button>
                  <Button 
                    onClick={() => handleStatusUpdate(selectedRequest, 'Rejected')}
                    className="h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg flex-1"
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
