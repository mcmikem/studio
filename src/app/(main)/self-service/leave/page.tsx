'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Palmtree, PlusCircle, Clock, CheckCircle2, 
  XCircle, Calendar, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy } from 'firebase/firestore';
import { formatDateSafe, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createAlertAction } from '@/actions/mutations';
import { LeaveType } from '@/lib/types/hr';

const leaveTypes = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Study', 'Unpaid', 'Compassionate', 'Other'];
const leaveTypeCategories = leaveTypes;

export default function MyLeavePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const leaveQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'leave-requests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user]);

  const { data: requests, isLoading } = useCollection<any>(leaveQuery);

  const handleSubmit = async () => {
    if (!user || !form.startDate || !form.endDate || !form.reason) return;
    
    setIsSubmitting(true);
    try {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const result = await createLeaveRequestAction({
        userId: user.uid,
        userName: user.displayName || 'User',
        type: form.type as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: 'Pending',
        days: diffDays,
      });

      if (result.success) {
        toast({ title: "Leave Requested", description: `Your request for ${diffDays} days has been submitted.` });
        setShowRequestForm(false);
        setForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
        
        // Notify HR/Admin (Optional system alert)
        await createSystemAlert({
            type: 'hr',
            title: 'New Leave Request',
            message: `${user.displayName} requested ${diffDays} days of ${form.type} leave.`,
            link: '/hr/leave'
        });
      } else {
        toast({ variant: "destructive", title: "Registration Failed", description: result.error });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors: any = {
    'Pending': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'Approved': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    'Rejected': 'bg-rose-500/10 text-rose-600 border-rose-200',
    'Cancelled': 'bg-muted text-muted-foreground border-transparent'
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Leave Management"
        description="Request time off and track your leave balances."
        icon={Palmtree}
      >
        <Button onClick={() => setShowRequestForm(true)} className="btn-omuto shadow-comic-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Request Leave
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-2">Annual Leave</p>
                  <p className="text-4xl font-black text-primary tracking-tight">18 <span className="text-xs font-bold uppercase opacity-40">Days Left</span></p>
              </CardContent>
          </Card>
          <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-2">Sick Leave</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tight">5 <span className="text-xs font-bold uppercase opacity-40">Days Left</span></p>
              </CardContent>
          </Card>
          <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/50 mb-2">Pending Requests</p>
                  <p className="text-4xl font-black text-amber-600 tracking-tight">{requests?.filter((r: any) => r.status === 'Pending').length || 0}</p>
              </CardContent>
          </Card>
      </div>

      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Leave History</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Status of your recent leave applications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : requests && requests.length > 0 ? (
            <div className="divide-y divide-omuto-navy/5">
              {requests.map((req: any) => (
                <div key={req.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-omuto-navy/40">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-black text-omuto-navy tracking-tight">{req.type} Leave</p>
                            <Badge variant="outline" className={statusColors[req.status] || ''}>
                                {req.status}
                            </Badge>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {formatDateSafe(req.startDate, 'dateOnly')} — {formatDateSafe(req.endDate, 'dateOnly')} ({req.days} days)
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                      {req.status === 'Rejected' && (
                          <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Reason: {req.rejectionReason || 'No reason provided'}</p>
                      )}
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Applied on {formatDateSafe(req.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
                 <Palmtree className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                 <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No leave history recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Form Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="sm:max-w-lg border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-muted/30 border-b">
            <DialogTitle className="font-black uppercase tracking-tight text-omuto-navy">Apply for Leave</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Submit your request for administrative review.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Leave Type</Label>
              <select
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full h-14 px-4 rounded-2xl border-2 bg-background font-bold text-omuto-navy text-lg appearance-none"
              >
                {leaveTypes.map(t => <option key={t} value={t}>{t} Leave</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Start Date</Label>
                  <Input 
                    type="date" 
                    value={form.startDate}
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="h-14 rounded-2xl border-2 font-bold text-omuto-navy"
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">End Date</Label>
                  <Input 
                    type="date" 
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="h-14 rounded-2xl border-2 font-bold text-omuto-navy"
                  />
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Reason / Notes</Label>
              <Textarea
                placeholder="Briefly state why you need this leave..."
                value={form.reason}
                onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                className="min-h-[120px] rounded-2xl border-2 font-medium"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/30 border-t flex flex-col sm:flex-row gap-3">
             <Button variant="outline" onClick={() => setShowRequestForm(false)} className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs">Cancel</Button>
             <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !form.startDate || !form.endDate || !form.reason}
                className="h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex-1"
             >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Palmtree className="mr-2 h-4 w-4" />}
                Submit Request
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
