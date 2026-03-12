'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DynamicField = { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'date' | 'select'; required?: boolean; options?: string[]; hint?: string };
type DynamicForm = { id: string; title: string; description?: string; targetCollection: string; fields: DynamicField[] };

export default function DynamicGeneratedFormPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: form, isLoading } = useDoc<DynamicForm>(firestore && params?.id ? doc(firestore, 'dynamic-forms', params.id) : null);

  const setField = (key: string, value: any) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!firestore || !form || !user) return;
    const missing = (form.fields || []).find((f) => f.required && !String(values[f.key] ?? '').trim());
    if (missing) {
      toast({ variant: 'destructive', title: 'Missing field', description: `${missing.label} is required.` });
      return;
    }

    setIsSaving(true);
    try {
      await addDocumentNonBlocking(collection(firestore, form.targetCollection || 'dynamic-form-submissions'), {
        formId: form.id,
        formTitle: form.title,
        values,
        submittedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Submission saved', description: 'Data is now available to dashboards and analysis.' });
      setValues({});
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message || 'Could not save form data.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!form) return <p className="text-sm text-muted-foreground">Form not found.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        <CardDescription>{form.description || 'Fill and submit this generated form.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(form.fields || []).map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}{field.required ? ' *' : ''}</Label>
            {field.type === 'textarea' ? (
              <Textarea value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            ) : field.type === 'select' ? (
              <Select value={values[field.key] || ''} onValueChange={(value) => setField(field.key, value)}>
                <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                <SelectContent>{(field.options || []).map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            )}
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        ))}

        <Button onClick={save} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Form Data
        </Button>
      </CardContent>
    </Card>
  );
}
