
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, ListChecks, Loader2 } from 'lucide-react';
import type { TaskTemplate } from '@/lib/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { EmptyState } from '@/components/ui/empty-state';

const templateSchema = z.object({
  title: z.string().min(3, 'Template title is required.'),
  checklistItems: z.array(z.object({ value: z.string().min(1, "Checklist item can't be empty.") })).min(1, 'At least one checklist item is required.'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

function TemplateForm({
  template,
  onFormSubmit,
}: {
  template?: TaskTemplate;
  onFormSubmit: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? { title: template.title, checklistItems: template.checklistItems.map(item => ({ value: item })) }
      : { title: '', checklistItems: [{ value: '' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "checklistItems"
  });

  const onSubmit = async (data: TemplateFormData) => {
    if (!firestore) return;

    const templateData = {
        title: data.title,
        checklistItems: data.checklistItems.map(item => item.value),
    };

    if (template) {
        const templateRef = doc(firestore, 'task-templates', template.id);
        updateDocumentNonBlocking(templateRef, templateData);
        toast({ title: 'Template Updated!', description: `"${data.title}" has been updated.` });
    } else {
        const templatesCollection = collection(firestore, 'task-templates');
        addDocumentNonBlocking(templatesCollection, { ...templateData, createdAt: serverTimestamp() });
        toast({ title: 'Template Created!', description: `"${data.title}" is now available for use.` });
    }

    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Template Title</Label>
        <Input id="title" {...register('title')} placeholder="e.g., Monthly Facility Inspection" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Checklist Items</Label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input {...register(`checklistItems.${index}.value`)} placeholder={`Item #${index + 1}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {errors.checklistItems?.root && <p className="text-sm text-destructive">{errors.checklistItems.root.message}</p>}
        {errors.checklistItems?.message && <p className="text-sm text-destructive">{errors.checklistItems.message}</p>}
         <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function TemplatesPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const { toast } = useToast();
  
  const firestore = useFirestore();
  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'task-templates'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: templates, isLoading } = useCollection<TaskTemplate>(templatesQuery);

  const handleDelete = (template: TaskTemplate) => {
    if (!firestore) return;
    const templateRef = doc(firestore, 'task-templates', template.id);
    deleteDocumentNonBlocking(templateRef);
    toast({
      title: 'Template Deleted',
      description: `"${template.title}" has been removed.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Task Templates</CardTitle>
            <CardDescription>
              Create and manage reusable checklists for common tasks.
            </CardDescription>
          </div>
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task Template</DialogTitle>
                <DialogDescription>
                  Define a new reusable checklist for your team.
                </DialogDescription>
              </DialogHeader>
              <TemplateForm onFormSubmit={() => setIsNewDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                </Card>
            ))}
            {!isLoading && templates && templates.length > 0 ? (
                templates.map((template) => (
                    <Card key={template.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{template.title}</h3>
                                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                                    {template.checklistItems.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                                    {template.checklistItems.length > 3 && <li>...and {template.checklistItems.length - 3} more</li>}
                                </ul>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the template "{template.title}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(template)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                !isLoading && (
                    <EmptyState 
                        icon={ListChecks}
                        title="No Templates Found"
                        description="Be the first to create a reusable checklist for your team!"
                    />
                )
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Edit Task Template</DialogTitle>
            <DialogDescription>Update the details for "{editingTemplate?.title}".</DialogDescription>
            </DialogHeader>
            {editingTemplate && <TemplateForm template={editingTemplate} onFormSubmit={() => setEditingTemplate(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
