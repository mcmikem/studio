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
import { Loader2, AlertCircle, ArrowLeft, MapPin, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type DynamicField = { 
    key: string; 
    label: string; 
    type: 'text' | 'textarea' | 'number' | 'date' | 'select'; 
    required?: boolean; 
    options?: string[]; 
    hint?: string 
};
type DynamicForm = { id: string; title: string; description?: string; targetCollection: string; fields: DynamicField[] };

export default function DynamicGeneratedFormPage() {
    const params = useParams();
    const formId = params?.id as string;
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [values, setValues] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);

    const docRef = firestore && formId ? doc(firestore, 'dynamic-forms', formId) : null;
    const { data: form, isLoading, error } = useDoc<DynamicForm>(docRef);

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

    if (isLoading) {
        return (
            <div className="container py-8 max-w-4xl">
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-bold">Loading form...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8 max-w-4xl">
                <Card className="max-w-lg mx-auto">
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <p className="font-bold text-lg">Error loading form</p>
                        <p className="text-sm text-muted-foreground text-center">Please try refreshing the page.</p>
                        <Button asChild>
                            <Link href="/meal/impact-studio">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Impact Studio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="container py-8 max-w-4xl">
                <Card className="max-w-lg mx-auto">
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                        <p className="font-bold text-lg">Form not found</p>
                        <p className="text-sm text-muted-foreground text-center">This form may have been deleted or the link is invalid.</p>
                        <Button asChild>
                            <Link href="/meal/impact-studio">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Impact Studio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderField = (field: DynamicField) => {
        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea 
                        value={values[field.key] || ''} 
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="min-h-[100px]"
                    />
                );
            case 'select':
                return (
                    <Select value={values[field.key] || ''} onValueChange={(value) => setField(field.key, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'number':
                return (
                    <Input 
                        type="number"
                        value={values[field.key] || ''} 
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            case 'date':
                return (
                    <Input 
                        type="date"
                        value={values[field.key] || ''} 
                        onChange={(e) => setField(field.key, e.target.value)}
                    />
                );
            default:
                return (
                    <Input 
                        type="text"
                        value={values[field.key] || ''} 
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
        }
    };

    return (
        <div className="container py-8 max-w-4xl">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="bg-muted/30 dark:bg-omuto-navy/10 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black">{form.title}</CardTitle>
                            <CardDescription>{form.description || 'Fill and submit this generated form.'}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/meal/impact-studio">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {(!form.fields || form.fields.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="font-bold">This form has no fields defined.</p>
                            <p className="text-sm mt-1">Go back to Impact Studio and regenerate the form.</p>
                        </div>
                    ) : (
                        form.fields.map((field) => (
                            <div key={field.key} className="space-y-2">
                                <Label className="font-bold text-sm uppercase">
                                    {field.label}
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                </Label>
                                {renderField(field)}
                                {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                            </div>
                        ))
                    )}

                    <Button 
                        onClick={save} 
                        disabled={isSaving || !form.fields?.length} 
                        className="w-full h-12"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Save Form Data
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
