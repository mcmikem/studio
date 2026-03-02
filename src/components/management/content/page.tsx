
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Activity, Testimony } from '@/lib/types';
import { Camera, FileText, CheckSquare, Sparkles, Wand, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { runImpactStoryGenerator, runTestimonyProcessor } from '@/ai/actions';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/lib/utils';
import { runQualitativeAnalysis } from '@/ai/actions';

interface ContentItem {
    id: string;
    type: 'activity' | 'testimony';
    source: Activity | Testimony;
    status: 'new' | 'drafting' | 'review' | 'done';
    aiDraft?: any; // To hold story or testimony summary
}

function ContentCard({ item, onDraftReady }: { item: ContentItem, onDraftReady: (itemId: string, draft: any) => void }) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const generateDraft = async () => {
        setIsGenerating(true);
        try {
            let draft;
            if (item.type === 'activity') {
                const activity = item.source as Activity;
                draft = await runImpactStoryGenerator({
                    activityName: activity.title,
                    activityDescription: `An activity on ${formatDateSafe(activity.loggedAt)}`,
                    activityImpact: `Value: ${activity.totalValue}, ROI: ${activity.finalRoi}%`,
                    userName: activity.userName,
                    userQuote: activity.beneficiaryQuote,
                    memorableMoment: activity.memorableMoment,
                    challengesLearned: activity.challengesLearned,
                });
            } else {
                const testimony = item.source as Testimony;
                // Note: This assumes testimony.mediaUrls[0] is a valid media URI.
                // In a real app, you would handle this more robustly.
                if (testimony.mediaUrls && testimony.mediaUrls[0]) {
                     draft = await runTestimonyProcessor({ mediaUri: testimony.mediaUrls[0] });
                } else {
                    throw new Error("Testimony has no media to process.");
                }
            }
            onDraftReady(item.id, draft);
        } catch (error) {
            console.error("AI draft generation failed:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not generate draft." });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="card-comic-clean">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                    {item.type === 'activity' ? <Camera className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {item.source.title}
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                    {item.type === 'activity' ? 'From Activity Log' : 'From Testimony Library'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {item.status === 'new' && (
                    <Button onClick={generateDraft} disabled={isGenerating} className="btn-omuto w-full h-10">
                        {isGenerating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generate Draft
                    </Button>
                )}
                 {item.status === 'review' && item.aiDraft && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-omuto-navy/50">AI Generated Draft</h4>
                        <Textarea 
                            defaultValue={item.type === 'activity' ? item.aiDraft.impactStory : item.aiDraft.summary}
                            className="h-48 border-lg"
                        />
                         <Button className="btn-omuto bg-omuto-teal w-full h-10 mt-2">
                           <CheckSquare className="h-4 w-4 mr-2" /> Mark as Ready
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ContentCommandPage() {
    const firestore = useFirestore();
    const [contentPipeline, setContentPipeline] = useState<ContentItem[]>([]);

    const activitiesQuery = useMemoFirebase((db) => db ? query(collection(db, 'activities'), where('indirectValue', '>', 0), orderBy('indirectValue', 'desc'), limit(10)) : null, []);
    const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);

    const testimoniesQuery = useMemoFirebase((db) => db ? query(collection(db, 'testimonies'), orderBy('createdAt', 'desc'), limit(10)) : null, []);
    const { data: testimonies, isLoading: isLoadingTestimonies } = useCollection<Testimony>(testimoniesQuery);
    
    useEffect(() => {
        const newItems: ContentItem[] = [];
        activities?.forEach(a => newItems.push({ id: a.id, type: 'activity', source: a, status: 'new' }));
        testimonies?.forEach(t => newItems.push({ id: t.id, type: 'testimony', source: t, status: 'new' }));
        setContentPipeline(newItems);
    }, [activities, testimonies]);

    const handleDraftReady = (itemId: string, draft: any) => {
        setContentPipeline(prev => prev.map(item => 
            item.id === itemId ? { ...item, status: 'review', aiDraft: draft } : item
        ));
    };

    const columns = {
        new: contentPipeline.filter(i => i.status === 'new'),
        review: contentPipeline.filter(i => i.status === 'review'),
    };
    
    const isLoading = isLoadingActivities || isLoadingTestimonies;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Content Command</h1>
                <p className="text-muted-foreground">Automated pipeline for turning field data into media content.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Incoming Feed */}
                <Card className="bg-white/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand className="text-primary h-5 w-5" /> Incoming Feed
                        </CardTitle>
                        <CardDescription>New activities and testimonies ready for AI processing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoading && <Skeleton className="h-32 w-full" />}
                         {columns.new.length > 0 ? columns.new.map(item => (
                            <ContentCard key={item.id} item={item} onDraftReady={handleDraftReady} />
                         )) : !isLoading && <p className="text-sm text-center text-muted-foreground py-10">No new content items.</p>}
                    </CardContent>
                </Card>

                {/* AI Drafts for Review */}
                <Card className="bg-white/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-omuto-yellow h-5 w-5" /> AI Drafts for Review
                        </CardTitle>
                        <CardDescription>AI-generated content ready for your review and edits.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoading && <Skeleton className="h-32 w-full" />}
                         {columns.review.length > 0 ? columns.review.map(item => (
                            <ContentCard key={item.id} item={item} onDraftReady={handleDraftReady} />
                         )) : !isLoading && <p className="text-sm text-center text-muted-foreground py-10">Generate a draft to see it here.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
