'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase, useUser, useFirebaseApp } from '@/firebase';
import { collection, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Loader2, Sparkles, FileUp, ClipboardList, ArrowRight } from 'lucide-react';
import { omutoAI } from '@/ai/actions';
import { callAIOfflineFirst, offlineOmutoAI } from '@/lib/offline-ai';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';

const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI did not return valid JSON.');
  return JSON.parse(match[0]);
};

type DynamicField = { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'date' | 'select'; required?: boolean; options?: string[]; hint?: string };
type DynamicForm = { id: string; title: string; description?: string; targetCollection: string; fields: DynamicField[] };

export default function ImpactStudioPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);

  const formsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'dynamic-forms'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: forms } = useCollection<DynamicForm>(formsQuery);

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
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message || 'Could not save knowledge source.' });
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>Impact Studio</CardTitle>
          <CardDescription>Create smart forms and train app knowledge from documents/text for stronger data capture and AI support.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Form Builder</CardTitle>
            <CardDescription>Describe data you want. System generates a ready-to-use form and adds it below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Form Name</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Community Outcome Tracking" /></div>
            <div><Label>What data should this form collect?</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[120px]" placeholder="Example: capture school, visit date, girls reached, key challenge, action taken, evidence link" /></div>
            <Button onClick={handleGenerateForm} disabled={isGenerating || !prompt.trim() || !formTitle.trim()} className="w-full">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate Form
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> AI Knowledge Upload</CardTitle>
            <CardDescription>Upload docs/PDFs or paste text so the app can use this context for analysis, parsing and prefill workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Source Title</Label><Input value={knowledgeTitle} onChange={(e) => setKnowledgeTitle(e.target.value)} placeholder="e.g., RED baseline report 2026" /></div>
            <div><Label>Paste text (optional but recommended)</Label><Textarea value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)} className="min-h-[120px]" /></div>
            <div><Label>Upload file (PDF/doc/image)</Label><Input type="file" onChange={(e) => setKnowledgeFile(e.target.files?.[0] || null)} /></div>
            <Button onClick={handleSaveKnowledge} disabled={isSavingKnowledge || (!knowledgeText.trim() && !knowledgeFile)} className="w-full">
              {isSavingKnowledge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />} Save to AI Knowledge
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Generated Forms</CardTitle>
          <CardDescription>Open and use generated forms on mobile or desktop.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(forms || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No generated forms yet.</p>
          ) : forms?.map((f) => (
            <div key={f.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
              <div><p className="font-semibold">{f.title}</p><p className="text-xs text-muted-foreground">{f.description}</p></div>
              <Button asChild variant="outline" size="sm"><Link href={`/meal/impact-studio/forms/${f.id}`}>Open Form <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
