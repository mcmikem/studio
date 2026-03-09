
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { PrintingJob } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Printer, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PrintingJobForm } from '@/components/forms/youth-center/printing-job-form';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from '@/hooks/use-toast';

export default function PrintingJobsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<PrintingJob | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const printingJobsQuery = useMemoFirebase(() => {
    return query(collection(firestore!, 'printing-jobs'), orderBy('jobDate', 'desc'));
  }, [firestore]);

  const { data: jobs, isLoading } = useCollection<PrintingJob>(printingJobsQuery);

  const handleEdit = (job: PrintingJob) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const handleDelete = (job: PrintingJob) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'printing-jobs', job.id))
      .then(() => toast({ title: "Printing Job Deleted" }))
      .catch((e) => toast({ variant: 'destructive', title: "Error", description: e.message }));
  };

  const paymentStatusColors: { [key: string]: string } = {
    Paid: 'border-green-500 bg-green-500/10 text-green-500',
    Partial: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
    Unpaid: 'border-red-500 bg-red-500/10 text-red-500',
  };

  const columns: ColumnDef<PrintingJob>[] = [
    {
      accessorKey: 'jobDate',
      header: 'Date',
      cell: ({ row }) => formatDateSafe(row.original.jobDate, 'dateOnly'),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
    },
    {
      accessorKey: 'pages_bw',
      header: 'B&W Pages',
    },
    {
      accessorKey: 'pages_color',
      header: 'Color Pages',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment Status',
      cell: ({ row }) => <Badge variant="outline" className={paymentStatusColors[row.original.paymentStatus]}>{row.original.paymentStatus}</Badge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleEdit(row.original)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete this printing job record.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(row.original)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          icon={Printer}
          title="Printing Jobs"
          description="Manage and track all printing service requests."
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Job
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={jobs || []} 
        isLoading={isLoading} 
        renderMobileCard={(job) => (
          <div className="p-4 border rounded-xl bg-background shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-bold text-omuto-navy">{job.clientName}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateSafe(job.jobDate, 'dateOnly')}</p>
              </div>
              <Badge variant="outline" className={paymentStatusColors[job.paymentStatus]}>{job.paymentStatus}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-dashed">
              <div>
                <p className="text-muted-foreground">B&W Pages</p>
                <p className="font-bold">{job.pages_bw}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Color Pages</p>
                <p className="font-bold">{job.pages_color}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-black text-primary">{formatCurrency(job.totalAmount)}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(job)}><Edit className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(job)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Printing Job' : 'Add New Printing Job'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the service request.
            </DialogDescription>
          </DialogHeader>
          <PrintingJobForm
            job={editingJob}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingJob(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
