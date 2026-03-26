'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Expense, User } from '@/lib/types';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { createSystemAlert } from '@/lib/notifications';
import Link from 'next/link';
import {
  FileText, Check, X, CheckCheck, PlusCircle, Clock, AlertCircle, Ban, Handshake, CheckCircle2, Eye, Receipt, Calendar, User as UserIcon
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

const statusColors: Record<string, string> = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
  Approved: 'border-blue-500 bg-blue-500/10 text-blue-600',
  Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-600',
  Acknowledged: 'border-green-500 bg-green-500/10 text-green-600',
  Rejected: 'border-red-500 bg-red-500/10 text-red-600',
};

export default function RequisitionsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

  const requisitions = useMemo(() => allExpenses?.filter(e => e.type === 'Requisition') || [], [allExpenses]);

  const approvalRoles = ['Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager'];
  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canApprove = profile && approvalRoles.includes(profile.role);
  const canManageFinances = profile && financeRoles.includes(profile.role);

  const pending = requisitions.filter(e => e.status === 'Pending');
  const approved = requisitions.filter(e => e.status === 'Approved');
  const disbursed = requisitions.filter(e => e.status === 'Disbursed');
  const acknowledged = requisitions.filter(e => e.status === 'Acknowledged');

  const handleStatusUpdate = async (expense: Expense, status: Expense['status']) => {
    if (!firestore || !user) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, 'expenses', expense.id), { status });
      toast({ title: `Requisition ${status}` });

      if (expense.userId !== user.uid) {
        let message = '';
        let type: 'Info' | 'Urgent' | 'Warning' = 'Info';
        let priority: 'Low' | 'Medium' | 'High' = 'Medium';

        if (status === 'Approved') {
            message = `Your requisition "${expense.title}" has been approved.`;
        } else if (status === 'Rejected') {
            message = `Your requisition "${expense.title}" has been rejected.`;
            type = 'Urgent';
        } else if (status === 'Disbursed') {
            message = `Funds for "${expense.title}" have been disbursed. Please acknowledge receipt.`;
            priority = 'High';
        }

        if (message) {
          await createSystemAlert(firestore, {
            type,
            priority,
            message,
            action: '/my-finances',
            creatorId: user.uid,
            targetUserIds: [expense.userId],
          });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Requisitions"
        description="Request and track project funds. Maintain full transparency from request to disbursement."
        icon={FileText}
      >
        <Button asChild className="btn-omuto shadow-comic-sm">
          <Link href="/forms/expense"><PlusCircle className="mr-2 h-4 w-4" /> New Request</Link>
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700 uppercase">Pending</span>
            </div>
            <p className="text-2xl font-black text-yellow-700 mt-1">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase">Approved</span>
            </div>
            <p className="text-2xl font-black text-blue-700 mt-1">{approved.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase">Disbursed</span>
            </div>
            <p className="text-2xl font-black text-purple-700 mt-1">{disbursed.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700 uppercase">Acknowledged</span>
            </div>
            <p className="text-2xl font-black text-green-700 mt-1">{acknowledged.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-red-700 uppercase">Rejected</span>
            </div>
            <p className="text-2xl font-black text-red-700 mt-1">{requisitions.filter(e => e.status === 'Rejected').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requisition List */}
      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">All Requests</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Audit log of all financial requisitions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="sm:hidden divide-y divide-omuto-navy/5">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-6"><Skeleton className="h-24 w-full rounded-2xl" /></div>)}
            {requisitions.map(expense => (
              <div key={expense.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-omuto-navy truncate">{expense.title}</h4>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedExpense(expense)}>
                                <Eye className="h-3 w-3" />
                            </Button>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">{expense.userName} · {formatDateSafe(expense.date, 'dateOnly')}</p>
                    </div>
                    <Badge variant="outline" className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest', statusColors[expense.status])}>{expense.status}</Badge>
                  </div>
                  <p className="text-2xl font-black tracking-tighter text-omuto-navy">{formatCurrency(expense.totalAmount)}</p>
                  
                  <div className="flex gap-2 justify-end pt-2">
                    {canApprove && expense.status === 'Pending' && expense.userId !== user?.uid && (
                        <>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(expense, 'Approved')} className="flex-1 h-11 border-2 border-emerald-500/50 text-emerald-600 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 rounded-xl">Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(expense, 'Rejected')} className="flex-1 h-11 border-2 border-rose-500/50 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 rounded-xl text-center">Reject</Button>
                        </>
                    )}
                    {canManageFinances && expense.status === 'Approved' && (
                        <Button size="sm" className="w-full h-11 bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg rounded-xl" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Disburse Funds</Button>
                    )}
                  </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                  <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">User</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Mission/Title</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Status</TableHead>
                  <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Amount</TableHead>
                  <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="p-8 text-center"><Skeleton className="h-6 w-full rounded-lg" /></TableCell></TableRow>
                ))}
                {requisitions.map(expense => (
                  <TableRow key={expense.id} className="hover:bg-muted/20 border-omuto-navy/5 transition-colors">
                    <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-3 font-bold text-omuto-navy leading-none">
                            <div className="h-8 w-8 rounded-full bg-omuto-navy/5 border flex items-center justify-center text-[10px] uppercase">{expense.userName.charAt(0)}</div>
                            {expense.userName}
                        </div>
                    </TableCell>
                    <TableCell className="py-6 min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-omuto-navy leading-snug">{expense.title}</p>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedExpense(expense)}>
                                <Eye className="h-3 w-3" />
                            </Button>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">{formatDateSafe(expense.date, 'dateOnly')}</p>
                    </TableCell>
                    <TableCell className="py-6">
                        <Badge variant="outline" className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider', statusColors[expense.status])}>{expense.status}</Badge>
                    </TableCell>
                    <TableCell className="py-6 text-right font-black text-lg tracking-tight text-omuto-navy">{formatCurrency(expense.totalAmount)}</TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {canApprove && expense.status === 'Pending' && expense.userId !== user?.uid && (
                          <>
                            <Button size="icon" variant="outline" className="h-10 w-10 border-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 rounded-xl" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-5 w-5" /></Button>
                            <Button size="icon" variant="outline" className="h-10 w-10 border-2 border-rose-500/30 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-5 w-5" /></Button>
                          </>
                        )}
                        {canManageFinances && expense.status === 'Approved' && (
                          <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Disburse</Button>
                        )}
                        {expense.status === 'Disbursed' && expense.userId === user?.uid && (
                          <Button size="sm" variant="outline" className="border-green-500/50 text-green-600 hover:bg-green-50 font-black uppercase text-[10px] h-10 rounded-xl" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}>Acknowledge</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  {selectedExpense.title}
                </DialogTitle>
                <DialogDescription>
                  Request details and breakdown
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status & Amount */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn('px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider', statusColors[selectedExpense.status])}>
                      {selectedExpense.status}
                    </Badge>
                    <span className="text-sm font-medium text-muted-foreground">{selectedExpense.type}</span>
                  </div>
                  <p className="text-2xl font-black text-omuto-navy">{formatCurrency(selectedExpense.totalAmount)}</p>
                </div>

                {/* Requester Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Requested By</span>
                    </div>
                    <p className="font-bold text-omuto-navy">{selectedExpense.userName}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Date</span>
                    </div>
                    <p className="font-bold text-omuto-navy">{formatDateSafe(selectedExpense.date, 'full')}</p>
                  </div>
                </div>

                {/* Project Info */}
                {selectedExpense.projectName && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-blue-600">Project</span>
                    <p className="font-bold text-omuto-navy mt-1">{selectedExpense.projectName}</p>
                  </div>
                )}

                {/* Line Items Breakdown */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold uppercase text-muted-foreground">Expense Breakdown</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-xs font-black uppercase">Description</TableHead>
                          <TableHead className="text-xs font-black uppercase">Category</TableHead>
                          <TableHead className="text-right text-xs font-black uppercase">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExpense.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
            <tfoot>
                <tr>
                  <td colSpan={Object.keys(requisitions[0] || {}).length + 3}>
                    {isLoadingMore && <Skeleton className="h-10 w-full" />}
                  </td>
                </tr>
              </tfoot>
                    </Table>
                  </div>
                </div>

                {/* Receipt */}
                {selectedExpense.receiptUrl && (
                  <div>
                    <span className="text-sm font-bold uppercase text-muted-foreground">Receipt Attached</span>
                    <a 
                      href={selectedExpense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 block p-4 border rounded-xl hover:bg-muted/20 transition-colors"
                    >
                      <img 
                        src={selectedExpense.receiptUrl} 
                        alt="Receipt" 
                        className="max-h-48 rounded-lg mx-auto"
                      />
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {canApprove && selectedExpense.status === 'Pending' && selectedExpense.userId !== user?.uid && (
                    <>
                      <Button onClick={() => { handleStatusUpdate(selectedExpense, 'Approved'); setSelectedExpense(null); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button onClick={() => { handleStatusUpdate(selectedExpense, 'Rejected'); setSelectedExpense(null); }} variant="outline" className="flex-1 border-rose-500/50 text-rose-600 hover:bg-rose-50">
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  {canManageFinances && selectedExpense.status === 'Approved' && (
                    <Button onClick={() => { handleStatusUpdate(selectedExpense, 'Disbursed'); setSelectedExpense(null); }} className="w-full bg-purple-600 hover:bg-purple-700">
                      <Handshake className="mr-2 h-4 w-4" /> Disburse Funds
                    </Button>
                  )}
                  {selectedExpense.status === 'Disbursed' && selectedExpense.userId === user?.uid && (
                    <Button onClick={() => { handleStatusUpdate(selectedExpense, 'Acknowledged'); setSelectedExpense(null); }} className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCheck className="mr-2 h-4 w-4" /> Acknowledge Receipt
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}