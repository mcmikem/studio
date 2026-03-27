'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, ArrowLeft, MapPin, Camera, FileUp, CheckSquare, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

type DynamicField = { 
    key: string; 
    label: string; 
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file' | 'location' | 'gps'; 
    required?: boolean; 
    options?: string[]; 
    hint?: string 
};
type DynamicForm = { id: string; title: string; description?: string; targetCollection: string; fields: DynamicField[] };

function DynamicGeneratedFormContent() {
    const params = useParams<{ id: string }>();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [values, setValues] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState<Record<string, boolean>>({});
    const [files, setFiles] = useState<Record<string, File | null>>({});

    const docRef = firestore && params?.id ? doc(firestore, 'dynamic-forms', params.id as string) : null;
    const { data: form, isLoading, error } = useDoc<DynamicForm>(docRef);

    const setField = (key: string, value: any) => setValues((prev) => ({ ...prev, [key]: value }));

    const handleGPS = async (key: string) => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'GPS not available', description: 'Your device does not support GPS.' });
            return;
        }
        setGpsLoading(prev => ({ ...prev, [key]: true }));
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setField(key, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                toast({ title: 'Location captured', description: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
                setGpsLoading(prev => ({ ...prev, [key]: false }));
            },
            (err) => {
                toast({ variant: 'destructive', title: 'GPS failed', description: err.message });
                setGpsLoading(prev => ({ ...prev, [key]: false }));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const save = async () => {
        if (!firestore || !form || !user) return;
        const missing = (form.fields || []).find((f) => f.required && !String(values[f.key] ?? '').trim());
        if (missing) {
            toast({ variant: 'destructive', title: 'Missing field', description: `${missing.label} is required.` });
            return;
        }

        setIsSaving(true);
        try {
            // Handle file uploads if any
            const fileUrls: Record<string, string> = {};
            for (const [key, file] of Object.entries(files)) {
                if (file) {
                    // File upload would go here - for now just store filename
                    fileUrls[key] = file.name;
                }
            }

            await addDocumentNonBlocking(collection(firestore, form.targetCollection || 'dynamic-form-submissions'), {
                formId: form.id,
                formTitle: form.title,
                values,
                files: fileUrls,
                submittedBy: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Submission saved', description: 'Data is now available to dashboards and analysis.' });
            setValues({});
            setFiles({});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save failed', description: e?.message || 'Could not save form data.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold">Loading form...</p>
            </div>
        );
    }

    if (error) {
        return (
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
        );
    }

    if (!form) {
        return (
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
                        className="border-lg rounded-xl min-h-[100px] font-bold"
                    />
                );
            case 'select':
                return (
                    <Select value={values[field.key] || ''} onValueChange={(value) => setField(field.key, value)}>
                        <SelectTrigger className="border-lg rounded-xl h-12 font-bold">
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'checkbox':
                return (
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                        <Checkbox 
                            checked={values[field.key] || false} 
                            onCheckedChange={(checked) => setField(field.key, checked)}
                            className="h-6 w-6"
                        />
                        <span className="font-bold">{field.label}</span>
                    </div>
                );
            case 'radio':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(field.options || []).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setField(field.key, opt)}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${
                                    values[field.key] === opt 
                                        ? 'border-primary bg-primary/10 text-primary' 
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                {values[field.key] === opt && <CheckSquare className="h-4 w-4 mr-2 inline" />}
                                {opt}
                            </button>
                        ))}
                    </div>
                );
            case 'file':
                return (
                    <div className="space-y-2">
                        <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setFiles(prev => ({ ...prev, [field.key]: file }));
                                    setField(field.key, file.name);
                                }
                            }}
                            className="hidden"
                            id={`file-${field.key}`}
                        />
                        <Button 
                            type="button"
                            variant="outline" 
                            onClick={() => document.getElementById(`file-${field.key}`)?.click()}
                            className="w-full h-12 rounded-xl border-lg"
                        >
                            {files[field.key] ? (
                                <span className="flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    {files[field.key]?.name}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    Take Photo or Upload File
                                </span>
                            )}
                        </Button>
                    </div>
                );
            case 'location':
            case 'gps':
                return (
                    <div className="flex gap-2">
                        <Input 
                            value={values[field.key] || ''} 
                            onChange={(e) => setField(field.key, e.target.value)}
                            placeholder="GPS coordinates or location"
                            className="border-lg rounded-xl h-12 font-bold flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleGPS(field.key)}
                            disabled={gpsLoading[field.key]}
                            className="h-12 w-12 rounded-xl border-lg"
                        >
                            {gpsLoading[field.key] ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <MapPin className="h-5 w-5 text-primary" />
                            )}
                        </Button>
                    </div>
                );
            default:
                return (
                    <Input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={values[field.key] || ''} 
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="border-lg rounded-xl h-12 font-bold"
                    />
                );
        }
    };

    return (
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
                            <Label className="font-bold text-sm uppercase tracking-widest">
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
                    className="w-full btn-omuto h-12 rounded-xl font-black uppercase tracking-widest"
                >
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Save Form Data
                </Button>
            </CardContent>
        </Card>
    );
}

export default function DynamicGeneratedFormPage() {
    return (
        <div className="container py-8 max-w-4xl">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-bold">Loading...</p>
                </div>
            }>
                <DynamicGeneratedFormContent />
            </Suspense>
        </div>
    );
}
