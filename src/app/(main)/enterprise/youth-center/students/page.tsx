'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Users, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  program: z.string().min(2),
  status: z.string().min(2),
  enrollmentDate: z.string().min(1),
});

type Student = z.infer<typeof schema> & { id: string };

export default function StudentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const q = useMemoFirebase(() => firestore ? query(collection(firestore, 'youth-center-students'), orderBy('enrollmentDate', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<Student>(q);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Student>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Active' } as Student,
  });

  const onAdd = () => { setEditing(null); reset({ fullName: '', phone: '', program: '', status: 'Active', enrollmentDate: '' } as Student); setOpen(true); };
  const onEdit = (item: Student) => { setEditing(item); reset(item); setOpen(true); };

  const onSubmit = async (values: Student) => {
    if (!firestore) return;
    const payload = { ...values, updatedAt: serverTimestamp() };
    if (editing) {
      await updateDocumentNonBlocking(doc(firestore, 'youth-center-students', editing.id), payload);
      toast({ title: 'Student updated' });
    } else {
      await addDocumentNonBlocking(collection(firestore, 'youth-center-students'), { ...payload, createdAt: serverTimestamp() });
      toast({ title: 'Student saved' });
    }
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, 'youth-center-students', id));
    toast({ title: 'Student deleted' });
  };

  const columns: ColumnDef<Student>[] = [
    { accessorKey: 'fullName', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'program', header: 'Program' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'enrollmentDate', header: 'Enrollment Date' },
    { id: 'actions', cell: ({ row }) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={Users} title="Students" description="Register students and keep student records updated." />
        <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
      </div>
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle><DialogDescription>Capture full details once, then edit anytime.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><Label>Full Name</Label><Input {...register('fullName')} /></div>
            <div><Label>Phone</Label><Input {...register('phone')} /></div>
            <div><Label>Program</Label><Input {...register('program')} placeholder="Course or track" /></div>
            <div><Label>Status</Label><Input {...register('status')} placeholder="Active / Completed / Paused" /></div>
            <div><Label>Enrollment Date</Label><Input type="date" {...register('enrollmentDate')} /></div>
            <Button type="submit" disabled={isSubmitting} className="w-full">{editing ? 'Update Student' : 'Save Student'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
