'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase, useUser, useFirebaseApp, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { 
    Loader2, Sparkles, FileUp, ClipboardList, ArrowRight, Trash2, 
    AlertCircle, Wifi, WifiOff, Cloud, CloudOff, Database,
    Clock, CheckCircle, Loader
} from 'lucide-react';
import { omutoAI } from '@/ai/actions';
import { callAIOfflineFirst, offlineOmutoAI } from '@/lib/offline-ai';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/use-network-status';

const extractJson = (text: string) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return valid JSON.');
    return JSON.parse(match[0]);
};

type DynamicField = { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'date' | 'select'; required?: boolean; options?: string[]; hint?: string };
type DynamicForm = { id: string; title: string; description?: string; targetCollection: string; fields: DynamicField[] };
type KnowledgeSource = { id: string; title: string; textContent: string; fileUrl: string; analysis: any; createdAt: any };

export default function ImpactStudioPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const firebaseApp = useFirebaseApp();
    const { toast } = useToast();
    const { isOnline } = useNetworkStatus();
    
    const [prompt, setPrompt] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [knowledgeTitle, setKnowledgeTitle] = useState('');
    const [knowledgeText, setKnowledgeText] = useState('');
    const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
    const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
    
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'form' | 'knowledge'; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    const formsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'dynamic-forms'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: forms } = useCollection<DynamicForm>(formsQuery);
    
    const knowledgeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'ai-knowledge-sources'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: knowledgeSources } = useCollection<KnowledgeSource>(knowledgeQuery);

    const handleGenerateForm = async () => {
        if (!user || !firestore || !prompt.trim() || !formTitle.trim()) return;
        setIsGenerating(true);
        try {
            const aiInput = {
                userId: user.uid,
                question: `Create a JSON object with keys: title, description, targetCollection, fields. fields should be array of {key,label,type,required,hint,options?}. Allowed field types: text,textarea,number,date,select. Prompt: ${prompt}`,
            };
            const ai = await callAIOfflineFirst(
                () => omutoAI(aiInput),
                () => offlineOmutoAI(aiInput)
            );
            const parsed = extractJson(ai.answer);
            await addDocumentNonBlocking(collection(firestore, 'dynamic-forms'), {
                title: formTitle,
                description: parsed.description || 'AI generated form',
                targetCollection: parsed.targetCollection || 'dynamic-form-submissions',
                fields: Array.isArray(parsed.fields) ? parsed.fields : [],
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Form generated', description: 'New form is ready for data collection.' });
            setPrompt('');
            setFormTitle('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Generation failed', description: e?.message || 'Could not generate form.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveKnowledge = async () => {
        if (!user || !firestore || (!knowledgeText.trim() && !knowledgeFile) || !firebaseApp) return;
        setIsSavingKnowledge(true);
        try {
            let fileUrl = '';
            if (knowledgeFile) {
                fileUrl = await uploadFile(firebaseApp, knowledgeFile, buildUploadPath.activityMedia(user.uid, knowledgeFile.name));
            }

            const analysisInput = { userId: user.uid, question: `Summarize key insights from this knowledge source for later form prefill and analysis use: ${knowledgeText}` };
            const analysis = knowledgeText.trim()
                ? await callAIOfflineFirst(
                    () => omutoAI(analysisInput),
                    () => offlineOmutoAI(analysisInput)
                )
                : null;

            await addDocumentNonBlocking(collection(firestore, 'ai-knowledge-sources'), {
                title: knowledgeTitle || 'Untitled source',
                textContent: knowledgeText || '',
                fileUrl,
                analysis,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Knowledge saved', description: 'Source added for future AI parsing/prefill workflows.' });
            setKnowledgeTitle('');
            setKnowledgeText('');
            setKnowledgeFile(null);
            if (document.getElementById('file-upload-input') as HTMLInputElement) {
                (document.getElementById('file-upload-input') as HTMLInputElement).value = '';
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save failed', description: e?.message || 'Could not save knowledge source.' });
        } finally {
            setIsSavingKnowledge(false);
        }
    };

    const handleDelete = async () => {
        if (!firestore || !deleteTarget) return;
        setIsDeleting(true);
        try {
            const collectionName = deleteTarget.type === 'form' ? 'dynamic-forms' : 'ai-knowledge-sources';
            await deleteDocumentNonBlocking(doc(firestore, collectionName, deleteTarget.id));
            toast({ title: 'Deleted', description: `${deleteTarget.title} has been deleted.` });
            setDeleteTarget(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete failed', description: e?.message });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Offline Status Banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                isOnline 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}>
                {isOnline ? (
                    <>
                        <Cloud className="h-5 w-5" />
                        <span className="font-medium text-sm">Online - Data syncs automatically</span>
                    </>
                ) : (
                    <>
                        <CloudOff className="h-5 w-5" />
                        <span className="font-medium text-sm">Offline - Changes will sync when connected</span>
                    </>
                )}
                {pendingSyncCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                        {pendingSyncCount} pending
                    </Badge>
                )}
            </div>

            <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Impact Studio
                    </CardTitle>
                    <CardDescription>Create smart forms and train app knowledge from documents/text for stronger data capture and AI support.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Form Builder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Form Builder</CardTitle>
                        <CardDescription>Describe data you want. System generates a ready-to-use form and adds it below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label className="font-bold text-xs uppercase tracking-wider">Form Name</Label>
                            <Input 
                                value={formTitle} 
                                onChange={(e) => setFormTitle(e.target.value)} 
                                placeholder="e.g., Community Outcome Tracking"
                                className="h-11 rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs uppercase tracking-wider">What data should this form collect?</Label>
                            <Textarea 
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                className="min-h-[120px] font-bold" 
                                placeholder="Example: capture school, visit date, girls reached, key challenge, action taken, evidence link"
                            />
                        </div>
                        <Button 
                            onClick={handleGenerateForm} 
                            disabled={isGenerating || !prompt.trim() || !formTitle.trim() || !isOnline} 
                            className="w-full"
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} 
                            Generate Form
                        </Button>
                    </CardContent>
                </Card>

                {/* AI Knowledge Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5 text-primary" /> AI Knowledge Upload</CardTitle>
                        <CardDescription>Upload docs/PDFs or paste text so the app can use this context for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label className="font-bold text-xs uppercase tracking-wider">Source Title</Label>
                            <Input 
                                value={knowledgeTitle} 
                                onChange={(e) => setKnowledgeTitle(e.target.value)} 
                                placeholder="e.g., RED baseline report 2026"
                                className="h-11 rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs uppercase tracking-wider">Paste text (optional)</Label>
                            <Textarea 
                                value={knowledgeText} 
                                onChange={(e) => setKnowledgeText(e.target.value)} 
                                className="min-h-[120px] font-bold"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs uppercase tracking-wider">Upload file (PDF/doc/image)</Label>
                            <div className="flex items-center gap-2">
                                <input 
                                    id="file-upload-input"
                                    type="file" 
                                    accept=".pdf,.doc,.docx,.txt,image/*"
                                    onChange={(e) => setKnowledgeFile(e.target.files?.[0] || null)} 
                                    className="hidden"
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => document.getElementById('file-upload-input')?.click()}
                                    className="w-full h-11 rounded-xl"
                                >
                                    {knowledgeFile ? knowledgeFile.name : 'Choose file or take photo'}
                                </Button>
                            </div>
                            {knowledgeFile && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary">{knowledgeFile.name}</Badge>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setKnowledgeFile(null);
                                            (document.getElementById('file-upload-input') as HTMLInputElement).value = '';
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Button 
                            onClick={handleSaveKnowledge} 
                            disabled={isSavingKnowledge || (!knowledgeText.trim() && !knowledgeFile) || !isOnline} 
                            className="w-full"
                        >
                            {isSavingKnowledge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />} 
                            Save to AI Knowledge
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Generated Forms List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Generated Forms</CardTitle>
                    <CardDescription>Open and use generated forms on mobile or desktop.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(!forms || forms.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No generated forms yet.</p>
                    ) : forms.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{f.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/meal/impact-studio/forms/${f.id}`}>Open</Link>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setDeleteTarget({ id: f.id, type: 'form', title: f.title })}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Knowledge Sources List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> AI Knowledge Sources</CardTitle>
                    <CardDescription>Uploaded documents and text sources for AI training.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(!knowledgeSources || knowledgeSources.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No knowledge sources yet.</p>
                    ) : knowledgeSources.map((k) => (
                        <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{k.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {k.fileUrl && <span className="mr-2">File attached</span>}
                                        {k.analysis && <span className="text-green-600">Analyzed</span>}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                {k.fileUrl && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={k.fileUrl} target="_blank">View</Link>
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setDeleteTarget({ id: k.id, type: 'knowledge', title: k.title })}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
