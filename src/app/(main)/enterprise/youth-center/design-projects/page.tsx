'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Brush, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  clientName: z.string().min(2),
  projectName: z.string().min(2),
  status: z.string().min(2),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type DesignProject = FormData & { id: string };

export default function DesignProjectsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DesignProject | null>(null);

  const q = useMemoFirebase(() => firestore ? query(collection(firestore, 'youth-center-design-projects'), orderBy('dueDate', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<DesignProject>(q);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Planned' },
  });

  const onAdd = () => {
    setEditing(null);
    reset({ clientName: '', projectName: '', status: 'Planned', dueDate: '', notes: '' });
    setOpen(true);
  };

  const onEdit = (item: DesignProject) => {
    setEditing(item);
    reset(item);
    setOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    if (!firestore) return;
    if (editing) {
      await updateDocumentNonBlocking(doc(firestore, 'youth-center-design-projects', editing.id), { ...values, updatedAt: serverTimestamp() });
      toast({ title: 'Project updated' });
    } else {
      await addDocumentNonBlocking(collection(firestore, 'youth-center-design-projects'), { ...values, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast({ title: 'Project saved' });
    }
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, 'youth-center-design-projects', id));
    toast({ title: 'Project deleted' });
  };

  const columns: ColumnDef<DesignProject>[] = [
    { accessorKey: 'projectName', header: 'Project' },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'dueDate', header: 'Due Date' },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={Brush} title="Design Projects" description="Capture, update, and track all design jobs." />
        <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
      </div>
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Design Project' : 'Add Design Project'}</DialogTitle>
            <DialogDescription>Fill all fields clearly so the team can follow up easily.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><Label>Project Name</Label><Input {...register('projectName')} /></div>
            <div><Label>Client Name</Label><Input {...register('clientName')} /></div>
            <div><Label>Status</Label><Input {...register('status')} placeholder="Planned, In Progress, Completed" /></div>
            <div><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
            <div><Label>Notes</Label><Textarea {...register('notes')} /></div>
            <Button type="submit" disabled={isSubmitting} className="w-full">{editing ? 'Update Project' : 'Save Project'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
