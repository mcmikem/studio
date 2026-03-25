'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  CreditCard, Banknote, Calculator, 
  CheckCircle2, AlertCircle, Loader2, 
  ArrowRight, Search, Filter, 
  Download, Printer, Send, Wallet,
  Plus, Minus, TrendingUp
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy, where } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createPayrollRecordAction, createSystemAlert } from '@/actions/mutations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HRPayrollPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const staffQuery = useMemoFirebase((db) => query(collection(db, 'users'), orderBy('name')));
  const { data: staff, isLoading: isLoadingStaff } = useCollection<any>(staffQuery);

  const historyQuery = useMemoFirebase((db) => 
    query(collection(db, 'payroll'), where('month', '==', selectedMonth + 1), where('year', '==', selectedYear))
  );
  const { data: payrollHistory, isLoading: isLoadingHistory } = useCollection<any>(historyQuery);

  const [adjustments, setAdjustments] = useState<Record<string, { allowances: number, deductions: number }>>({});

  const handleAdjustmentChange = (userId: string, field: 'allowances' | 'deductions', value: string) => {
    const numValue = parseFloat(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: numValue
      }
    }));
  };

  const processPayroll = async (member: any) => {
    if (!user) return;
    
    const adj = adjustments[member.id] || { allowances: 0, deductions: 0 };
    const base = member.baseSalary || 0;
    const net = base + adj.allowances - adj.deductions;

    try {
      const result = await createPayrollRecordAction({
        userId: member.id,
        userName: member.name,
        month: selectedMonth + 1,
        year: selectedYear,
        basicSalary: base,
        allowances: adj.allowances,
        deductions: adj.deductions,
        netPay: net,
        status: 'Approved', // Auto-approve for now if admin is doing it
      });

      if (result.success) {
        toast({ title: "Payroll Generated", description: `Record for ${member.name} has been saved.` });
        
        // Notify the employee
        await createSystemAlert({
            type: 'finance',
            userId: member.id,
            title: 'Payslip Available',
            message: `Your payslip for ${months[selectedMonth]} ${selectedYear} is now available in My Hub.`,
            link: '/self-service/payslips'
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Process Error", description: `Failed for ${member.name}` });
    }
  };

  const calculateTotalPayroll = () => {
    if (!staff) return 0;
    return staff.reduce((acc: number, m: any) => {
        const adj = adjustments[m.id] || { allowances: 0, deductions: 0 };
        return acc + (m.baseSalary || 0) + adj.allowances - adj.deductions;
    }, 0);
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Payroll Terminal"
        description="Process salaries, manage allowances/deductions, and notify team."
        icon={CreditCard}
      >
        <div className="flex gap-3">
             <select 
                className="h-10 px-4 rounded-xl border-2 font-bold text-xs bg-white text-omuto-navy"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
                className="h-10 px-4 rounded-xl border-2 font-bold text-xs bg-white text-omuto-navy"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
             </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-2">Total Monthly Payout</p>
                  <p className="text-4xl font-black text-primary tracking-tight">{formatCurrency(calculateTotalPayroll())}</p>
              </CardContent>
          </Card>
          <Card className="border-2 border-omuto-navy/10 bg-white rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Staff Count</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">{staff?.length || 0}</p>
              </CardContent>
          </Card>
          <Card className="border-2 border-emerald-500/10 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-2">Status</p>
                  <div className="flex items-center gap-2 mt-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-lg font-black text-emerald-600 tracking-tight uppercase">Ready to Process</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Personnel Payroll Sheet</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    Managing {months[selectedMonth]} {selectedYear} Payouts
                </CardDescription>
              </div>
              <Button onClick={() => toast({ title: "Bulk Process", description: "This feature will process all staff at once." })} className="btn-omuto h-12 px-8 shadow-comic-sm">
                   <Send className="mr-2 h-4 w-4" /> Run Bulk Payroll
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingStaff ? (
            <div className="p-8 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/10 border-b">
                            <th className="px-8 py-4 text-left font-black uppercase text-[9px] tracking-widest text-muted-foreground">Team Member</th>
                            <th className="px-8 py-4 text-right font-black uppercase text-[9px] tracking-widest text-muted-foreground">Basic Salary</th>
                            <th className="px-8 py-4 text-center font-black uppercase text-[9px] tracking-widest text-muted-foreground">Allowances (+)</th>
                            <th className="px-8 py-4 text-center font-black uppercase text-[9px] tracking-widest text-muted-foreground">Deductions (-)</th>
                            <th className="px-8 py-4 text-right font-black uppercase text-[9px] tracking-widest text-muted-foreground">Net Pay</th>
                            <th className="px-8 py-4 text-right font-black uppercase text-[9px] tracking-widest text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-omuto-navy/5">
                        {staff?.map((m: any) => {
                            const adj = adjustments[m.id] || { allowances: 0, deductions: 0 };
                            const base = m.baseSalary || 0;
                            const net = base + adj.allowances - adj.deductions;
                            const alreadyPaid = payrollHistory?.some((p: any) => p.userId === m.id);

                            return (
                                <tr key={m.id} className="hover:bg-muted/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                <AvatarImage src={m.photoURL} />
                                                <AvatarFallback className="text-[10px] font-black">{m.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-black text-omuto-navy uppercase tracking-tight">{m.name}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{m.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-omuto-navy">
                                        {formatCurrency(base)}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-10 rounded-xl border-2 text-center text-xs font-bold"
                                                placeholder="0"
                                                value={adj.allowances || ''}
                                                onChange={(e) => handleAdjustmentChange(m.id, 'allowances', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-10 rounded-xl border-2 text-center text-xs font-bold border-rose-100 text-rose-600"
                                                placeholder="0"
                                                value={adj.deductions || ''}
                                                onChange={(e) => handleAdjustmentChange(m.id, 'deductions', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-omuto-navy">
                                        {formatCurrency(net)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {alreadyPaid ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                               <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                                            </Badge>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                onClick={() => processPayroll(m)}
                                                className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] bg-omuto-navy text-white hover:bg-primary transition-all"
                                            >
                                                Generate
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
