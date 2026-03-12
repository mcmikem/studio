'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { BookOpen, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  name: z.string().min(2),
  instructor: z.string().min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.string().min(2),
});

type Course = z.infer<typeof schema> & { id: string };

export default function CoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const q = useMemoFirebase(() => firestore ? query(collection(firestore, 'youth-center-courses'), orderBy('startDate', 'desc')) : null, [firestore]);
  const { data, isLoading } = useCollection<Course>(q);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Course>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Open' } as Course,
  });

  const onAdd = () => { setEditing(null); reset({ name: '', instructor: '', startDate: '', endDate: '', status: 'Open' } as Course); setOpen(true); };
  const onEdit = (item: Course) => { setEditing(item); reset(item); setOpen(true); };

  const onSubmit = async (values: Course) => {
    if (!firestore) return;
    const payload = { ...values, updatedAt: serverTimestamp() };
    if (editing) {
      await updateDocumentNonBlocking(doc(firestore, 'youth-center-courses', editing.id), payload);
      toast({ title: 'Course updated' });
    } else {
      await addDocumentNonBlocking(collection(firestore, 'youth-center-courses'), { ...payload, createdAt: serverTimestamp() });
      toast({ title: 'Course saved' });
    }
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, 'youth-center-courses', id));
    toast({ title: 'Course deleted' });
  };

  const columns: ColumnDef<Course>[] = [
    { accessorKey: 'name', header: 'Course' },
    { accessorKey: 'instructor', header: 'Instructor' },
    { accessorKey: 'startDate', header: 'Start' },
    { accessorKey: 'endDate', header: 'End' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', cell: ({ row }) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={BookOpen} title="Courses" description="Manage short courses and update them over time." />
        <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Course</Button>
      </div>
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Course' : 'Add Course'}</DialogTitle><DialogDescription>Enter clear course details so updates are easy for all staff.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><Label>Course Name</Label><Input {...register('name')} /></div>
            <div><Label>Instructor</Label><Input {...register('instructor')} /></div>
            <div><Label>Start Date</Label><Input type="date" {...register('startDate')} /></div>
            <div><Label>End Date</Label><Input type="date" {...register('endDate')} /></div>
            <div><Label>Status</Label><Input {...register('status')} placeholder="Open / Ongoing / Completed" /></div>
            <Button type="submit" disabled={isSubmitting} className="w-full">{editing ? 'Update Course' : 'Save Course'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
