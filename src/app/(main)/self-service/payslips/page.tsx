'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  CreditCard, FileText, Download, 
  Printer, ArrowRight, Wallet, 
  Calendar, CheckCircle2, TrendingUp,
  Banknote, ShieldCheck, Zap
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyPayslipsPage() {
  const { user } = useUser();
  
  const payrollQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'payroll'),
      where('userId', '==', user.uid),
      orderBy('year', 'desc'),
      orderBy('month', 'desc')
    );
  }, [user]);

  const { data: records, isLoading } = useCollection<any>(payrollQuery);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="My Payslips"
        description="View and download your official salary records and tax statements."
        icon={CreditCard}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-2">Total Earnings YTD</p>
                  <p className="text-4xl font-black text-primary tracking-tight">
                    {formatCurrency(records?.reduce((acc: number, r: any) => acc + (r.netPay || 0), 0) || 0)}
                  </p>
              </CardContent>
          </Card>
          <Card className="border-2 border-omuto-navy/10 bg-card rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Records Found</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">{records?.length || 0}</p>
              </CardContent>
          </Card>
           <Card className="border-2 border-emerald-500/10 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-2">Tax Compliance</p>
                  <div className="flex items-center gap-2 mt-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <p className="text-lg font-black text-emerald-600 tracking-tight uppercase">Verified</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Income History</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Official payslips issued by Omuto Foundation Finance</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : records && records.length > 0 ? (
            <div className="divide-y divide-omuto-navy/5">
              {records.map((r: any) => (
                <div key={r.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-card border-2 border-omuto-navy/5 shadow-sm flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-omuto-navy tracking-tight uppercase">
                                {months[r.month]} {r.year}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                <span>Ref: OM-PY-{r.id.substring(0, 6).toUpperCase()}</span>
                                <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                <span>{formatDateSafe(r.createdAt, 'dateOnly')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Net Payout</p>
                             <p className="text-lg font-black text-omuto-navy">{formatCurrency(r.netPay)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                 <Download className="h-4 w-4" />
                             </Button>
                             <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 hover:bg-omuto-navy hover:text-white hover:border-omuto-navy transition-all">
                                 <Printer className="h-4 w-4" />
                             </Button>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="py-24 text-center">
                 <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                 <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No payslips issued yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Wellness Tip */}
      <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] shadow-xl overflow-hidden p-8">
          <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-600 flex-shrink-0">
                  <Zap className="h-6 w-6" />
              </div>
              <div>
                  <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Financial Tip: Diversified Savings</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                      Consider automating a portion of your net pay into a separate emergency fund. 
                      Stable financial health starts with consistent, small contributions.
                  </p>
              </div>
          </div>
      </Card>
    </div>
  );
}
