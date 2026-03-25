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
        status: 'Approved',
      });

      if (result.success) {
        toast({ title: "Payroll Generated", description: `Record for ${member.name} has been saved.` });
        
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
    <div className="page-spacing pb-20">
      <PageHeader
        title="Payroll Terminal"
        description="Process salaries, manage allowances/deductions, and notify team."
        icon={CreditCard}
      >
        <div className="flex gap-2">
             <select 
                className="h-9 px-3 rounded-lg border font-bold text-[11px] bg-white text-omuto-navy uppercase tracking-wider"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
                className="h-9 px-3 rounded-lg border font-bold text-[11px] bg-white text-omuto-navy uppercase tracking-wider"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
             </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border shadow-sm bg-primary/5 border-primary/10">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-2">Total Monthly Payout</p>
                  <p className="text-2xl font-bold text-omuto-navy tracking-tight">{formatCurrency(calculateTotalPayroll())}</p>
              </CardContent>
          </Card>
          <Card className="border shadow-sm bg-white">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Staff Count</p>
                  <p className="text-2xl font-bold text-omuto-navy tracking-tight">{staff?.length || 0}</p>
              </CardContent>
          </Card>
          <Card className="border shadow-sm bg-emerald-50/30 border-emerald-100 hidden lg:block">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/60 mb-2">Status</p>
                  <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Ready to Process</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card className="border shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-omuto-navy">Personnel Payroll Sheet</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                    Managing {months[selectedMonth]} {selectedYear} Payouts
                </CardDescription>
              </div>
              <Button onClick={() => toast({ title: "Bulk Process", description: "This feature will process all staff at once." })} className="btn-omuto h-9 px-5 shadow-sm">
                   <Send className="mr-2 h-3.5 w-3.5" /> Run Bulk Payroll
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingStaff ? (
            <div className="p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/30 border-b">
                            <th className="px-6 py-3 text-left font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Team Member</th>
                            <th className="px-6 py-3 text-right font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Basic Salary</th>
                            <th className="px-6 py-3 text-center font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Allowances (+)</th>
                            <th className="px-6 py-3 text-center font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Deductions (-)</th>
                            <th className="px-6 py-3 text-right font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Net Pay</th>
                            <th className="px-6 py-3 text-right font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {staff?.map((m: any) => {
                            const adj = adjustments[m.id] || { allowances: 0, deductions: 0 };
                            const base = m.baseSalary || 0;
                            const net = base + adj.allowances - adj.deductions;
                            const alreadyPaid = payrollHistory?.some((p: any) => p.userId === m.id);

                            return (
                                <tr key={m.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                                <AvatarImage src={m.photoURL} />
                                                <AvatarFallback className="text-[10px] font-bold">{m.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-omuto-navy">{m.name}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">{m.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-omuto-navy text-sm">
                                        {formatCurrency(base)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-8 rounded-lg text-center text-xs font-bold border"
                                                placeholder="0"
                                                value={adj.allowances || ''}
                                                onChange={(e) => handleAdjustmentChange(m.id, 'allowances', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-8 rounded-lg text-center text-xs font-bold border-rose-100 text-rose-600 bg-rose-50/30"
                                                placeholder="0"
                                                value={adj.deductions || ''}
                                                onChange={(e) => handleAdjustmentChange(m.id, 'deductions', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-omuto-navy text-sm">
                                        {formatCurrency(net)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {alreadyPaid ? (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                               <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                                            </Badge>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                onClick={() => processPayroll(m)}
                                                className="h-8 px-4 rounded-lg font-bold uppercase tracking-wider text-[10px] bg-omuto-navy text-white hover:bg-primary transition-all shadow-sm"
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
