'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  ShieldAlert, MessageSquare, PlusCircle, 
  Send, Clock, CheckCircle2, 
  ShieldCheck, HelpCircle, AlertCircle,
  Loader2, HelpingHand, Scale
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy } from 'firebase/firestore';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createSystemAlert } from '@/actions/mutations';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function MyGrievancesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'Medium'
  });

  const grievancesQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'grievances'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user]);

  const { data: records, isLoading } = useCollection<any>(grievancesQuery);

  const handleSubmit = async () => {
    if (!user || !db || !form.subject || !form.description) return;
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'grievances'), {
        userId: user.uid,
        userName: user.displayName || 'User',
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        status: 'Open',
        createdAt: serverTimestamp(),
      });

      toast({ title: "Grievance Submitted", description: "Your concern has been logged securely." });
      setShowForm(false);
      setForm({ subject: '', description: '', priority: 'Medium' });
      
      // Notify HR
      await createSystemAlert({
          type: 'hr',
          title: 'New Support Case',
          message: `${user.displayName} submitted a grievance: ${form.subject}`,
          link: '/hr/grievances'
      });
    } catch (error) {
       toast({ variant: "destructive", title: "Submission Failed", description: "Error saving record." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors: any = {
    'Open': 'bg-rose-500/10 text-rose-600 border-rose-200',
    'In Review': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'Resolved': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Personal Support"
        description="A secure and confidential channel to report concerns and receive institutional support."
        icon={ShieldAlert}
      >
          <Button onClick={() => setShowForm(true)} className="btn-omuto h-12 px-8 shadow-comic-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Submit Case
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/30">
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">My Support Cases</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Track the resolution status of your submissions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
                  ) : records && records.length > 0 ? (
                    <div className="divide-y divide-omuto-navy/5">
                      {records.map((g: any) => (
                        <div key={g.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className={`h-14 w-14 rounded-2xl bg-white border-2 flex items-center justify-center text-omuto-navy group-hover:scale-105 transition-transform ${
                                    g.status === 'Open' ? 'border-rose-100' : 'border-omuto-navy/5'
                                }`}>
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-omuto-navy tracking-tight uppercase">{g.subject}</p>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                        <span className="text-primary">Ref: {g.id.substring(0, 6).toUpperCase()}</span>
                                        <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                        <span>Submitted {formatDateSafe(g.createdAt, 'dateOnly')}</span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusColors[g.status]}`}>
                                {g.status}
                            </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center">
                         <HelpingHand className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                         <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No active grievances or support cases.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <Card className="border-2 border-emerald-500/10 bg-emerald-500/5 rounded-[2.5rem] p-8">
                  <h4 className="text-sm font-black text-emerald-600 uppercase tracking-tight mb-4 flex items-center gap-2">
                       <ShieldCheck className="h-5 w-5" /> Professional Guarantee
                  </h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                      All submissions are encrypted and only accessible by authorized HR mediators. 
                      Omuto Foundation maintains a zero-tolerance policy for professional retaliation.
                  </p>
              </Card>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden p-8 bg-white">
                   <div className="flex items-start gap-4 h-full">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                          <Scale className="h-6 w-6" />
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Conflict Mediation</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                              Prefer an informal discussion? Speak with an ombudsman or your direct supervisor first.
                          </p>
                      </div>
                  </div>
              </Card>
          </div>
      </div>

       {/* Submit Dialog */}
       <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-muted/30 border-b">
            <DialogTitle className="font-black uppercase tracking-tight text-omuto-navy">Submit Support Case</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Detail your concern and institutional support requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Subject</Label>
              <Input 
                placeholder="e.g. Field allowance discrepancy"
                value={form.subject}
                onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                className="h-14 rounded-2xl border-2 font-bold text-omuto-navy"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Priority Level</Label>
              <select
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full h-14 px-4 rounded-2xl border-2 bg-background font-bold text-omuto-navy text-lg appearance-none"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High / Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Case Description</Label>
              <Textarea
                placeholder="Details of your concern..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[160px] rounded-2xl border-2 font-medium"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/30 border-t flex flex-col sm:flex-row gap-3">
             <Button variant="outline" onClick={() => setShowForm(false)} className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs">Cancel</Button>
             <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !form.subject || !form.description}
                className="h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-omuto-navy hover:bg-primary text-white shadow-lg flex-1"
             >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Securely
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
