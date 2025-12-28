

'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import type { KnowledgeHubSection, KnowledgeHubPitch, KnowledgeHubFAQ, KnowledgeHubStory } from '@/lib/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Copy, BookOpen, Download, Edit, Loader2, Search, MessageSquareQuote, Save, X, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { Textarea } from '../ui/textarea';

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
      <Copy className="h-4 w-4" />
    </Button>
  );
}

export default function KnowPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const [isEditMode, setIsEditMode] = useState(false);
  
  // Local state for editing
  const [editableSections, setEditableSections] = useState<KnowledgeHubSection[]>([]);
  const [editablePitches, setEditablePitches] = useState<KnowledgeHubPitch[]>([]);
  const [editableFaqs, setEditableFaqs] = useState<KnowledgeHubFAQ[]>([]);
  const [editableStories, setEditableStories] = useState<KnowledgeHubStory[]>([]);
  
  const { toast } = useToast();

  // Fetch data from Firestore
  const sectionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'knowledgeHubSections'), orderBy('order')) : null, [firestore]);
  const { data: sections, isLoading: isLoadingSections } = useCollection<KnowledgeHubSection>(sectionsQuery);

  const pitchesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'knowledgeHubPitches'), orderBy('order')) : null, [firestore]);
  const { data: pitches, isLoading: isLoadingPitches } = useCollection<KnowledgeHubPitch>(pitchesQuery);

  const faqsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'knowledgeHubFaqs'), orderBy('order')) : null, [firestore]);
  const { data: faqs, isLoading: isLoadingFaqs } = useCollection<KnowledgeHubFAQ>(faqsQuery);
  
  const storiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'knowledgeHubStories'), orderBy('order')) : null, [firestore]);
  const { data: stories, isLoading: isLoadingStories } = useCollection<KnowledgeHubStory>(storiesQuery);

  const canEdit = profile && ['Administrator', 'Executive Director'].includes(profile.role);
  const isLoading = isLoadingSections || isLoadingPitches || isLoadingFaqs || isLoadingStories;

  // Sync firestore data to local editable state when not in edit mode
  React.useEffect(() => {
    if (!isEditMode) {
      if (sections) setEditableSections(JSON.parse(JSON.stringify(sections)));
      if (pitches) setEditablePitches(JSON.parse(JSON.stringify(pitches)));
      if (faqs) setEditableFaqs(JSON.parse(JSON.stringify(faqs)));
      if (stories) setEditableStories(JSON.parse(JSON.stringify(stories)));
    }
  }, [sections, pitches, faqs, stories, isEditMode]);


  const handleSaveChanges = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
        return;
    }
    
    setIsDownloading(true); // Re-use isDownloading state for saving loader
    const batch = writeBatch(firestore);

    try {
        editableSections.forEach(section => {
            const ref = doc(firestore, 'knowledgeHubSections', section.id);
            batch.update(ref, { title: section.title, content: section.content });
        });
        editablePitches.forEach(pitch => {
            const ref = doc(firestore, 'knowledgeHubPitches', pitch.id);
            batch.update(ref, { title: pitch.title, content: pitch.content });
        });
        editableFaqs.forEach(faq => {
            const ref = doc(firestore, 'knowledgeHubFaqs', faq.id);
            batch.update(ref, { question: faq.question, answer: faq.answer });
        });
        editableStories.forEach(story => {
            const ref = doc(firestore, 'knowledgeHubStories', story.id);
            batch.update(ref, { title: story.title, content: story.content });
        });

        await batch.commit();
        toast({ title: 'Success!', description: 'Knowledge Hub content has been updated.' });
        setIsEditMode(false);
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
    } finally {
        setIsDownloading(false);
    }
  }
  
  const handleContentChange = (type: string, index: number, field: string, value: string) => {
    if (type === 'sections') {
        const newSections = [...editableSections];
        (newSections[index] as any)[field] = value;
        setEditableSections(newSections);
    } else if (type === 'pitches') {
        const newPitches = [...editablePitches];
        (newPitches[index] as any)[field] = value;
        setEditablePitches(newPitches);
    } else if (type === 'faqs') {
        const newFaqs = [...editableFaqs];
        (newFaqs[index] as any)[field] = value;
        setEditableFaqs(newFaqs);
    } else if (type === 'stories') {
        const newStories = [...editableStories];
        (newStories[index] as any)[field] = value;
        setEditableStories(newStories);
    }
  };


  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    setIsDownloading(true);
    html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save('Omuto_Knowledge_Hub.pdf');
      setIsDownloading(false);
    }).catch(err => {
      console.error("Failed to generate PDF", err);
      setIsDownloading(false);
    });
  };

  const filteredSections = useMemo(() => {
    if (!searchTerm) return editableSections;
    const lowercasedFilter = searchTerm.toLowerCase();
    return editableSections?.filter(section => 
        section.title.toLowerCase().includes(lowercasedFilter) ||
        section.content.toLowerCase().includes(lowercasedFilter) ||
        section.subsections?.some(sub => sub.title.toLowerCase().includes(lowercasedFilter) || sub.content.toLowerCase().includes(lowercasedFilter))
    );
  }, [editableSections, searchTerm]);

  const filteredPitches = useMemo(() => {
      if (!searchTerm) return editablePitches;
      const lowercasedFilter = searchTerm.toLowerCase();
      return editablePitches?.filter(pitch =>
          pitch.title.toLowerCase().includes(lowercasedFilter) ||
          pitch.content.toLowerCase().includes(lowercasedFilter)
      );
  }, [editablePitches, searchTerm]);

  const filteredFaqs = useMemo(() => {
      if (!searchTerm) return editableFaqs;
      const lowercasedFilter = searchTerm.toLowerCase();
      return editableFaqs?.filter(faq =>
          faq.question.toLowerCase().includes(lowercasedFilter) ||
          faq.answer.toLowerCase().includes(lowercasedFilter)
      );
  }, [editableFaqs, searchTerm]);
  
   const filteredStories = useMemo(() => {
      if (!searchTerm) return editableStories;
      const lowercasedFilter = searchTerm.toLowerCase();
      return editableStories?.filter(story =>
          story.title.toLowerCase().includes(lowercasedFilter) ||
          story.content.toLowerCase().includes(lowercasedFilter)
      );
  }, [editableStories, searchTerm]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      );
    }
    
    const isFiltering = searchTerm.length > 0;
    const noResults = filteredSections?.length === 0 && filteredPitches?.length === 0 && filteredFaqs?.length === 0 && filteredStories?.length === 0;

    return (
      <>
        {filteredSections && filteredSections.length > 0 && filteredSections.map((section, index) => (
          <Card key={section.id}>
            <CardHeader>
               {isEditMode ? <Input value={section.title} onChange={(e) => handleContentChange('sections', index, 'title', e.target.value)} /> : <CardTitle>{section.title}</CardTitle>}
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              {isEditMode ? <Textarea value={section.content} onChange={(e) => handleContentChange('sections', index, 'content', e.target.value)} className="min-h-24"/> : <div dangerouslySetInnerHTML={{ __html: section.content }} />}
              {section.subsections && (
                 <Accordion type="single" collapsible className="w-full mt-4" defaultValue={isFiltering ? `item-${section.id}`: undefined}>
                  <AccordionItem value={`item-${section.id}`}>
                    <AccordionTrigger>{section.title === 'Grant Boilerplates' ? 'View Boilerplates' : 'View Details'}</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {section.subsections.map((sub, index) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{sub.title}</h4>
                                <CopyButton text={sub.content} />
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: sub.content }} />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                 </Accordion>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredPitches && filteredPitches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>How to Talk About Omuto</CardTitle>
              <CardDescription>Copyable pitches for different audiences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredPitches.map((pitch, index) => (
                <div key={pitch.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    {isEditMode ? <Input value={pitch.title} onChange={(e) => handleContentChange('pitches', index, 'title', e.target.value)} /> : <h4 className="font-semibold">{pitch.title}</h4>}
                    {!isEditMode && <CopyButton text={pitch.content} />}
                  </div>
                  {isEditMode ? <Textarea value={pitch.content} onChange={(e) => handleContentChange('pitches', index, 'content', e.target.value)} /> : <p className="text-sm text-muted-foreground">{pitch.content}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

         {filteredStories && filteredStories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Impact Stories</CardTitle>
              <CardDescription>Short stories to use in communications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredStories.map((story, index) => (
                <div key={story.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                     {isEditMode ? <Input value={story.title} onChange={(e) => handleContentChange('stories', index, 'title', e.target.value)} /> : <h4 className="font-semibold flex items-center gap-2"><MessageSquareQuote className="h-4 w-4 text-primary" />{story.title}</h4>}
                    {!isEditMode && <CopyButton text={story.content} />}
                  </div>
                  {isEditMode ? <Textarea value={story.content} onChange={(e) => handleContentChange('stories', index, 'content', e.target.value)} /> : <p className="text-sm text-muted-foreground italic">"{story.content}"</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {filteredFaqs && filteredFaqs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={isFiltering ? filteredFaqs.map(f => f.id) : undefined}>
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{isEditMode ? <Input value={faq.question} onChange={(e) => handleContentChange('faqs', index, 'question', e.target.value)} /> : faq.question}</AccordionTrigger>
                    <AccordionContent>
                      {isEditMode ? <Textarea value={faq.answer} onChange={(e) => handleContentChange('faqs', index, 'answer', e.target.value)} /> : faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
        
        {isFiltering && noResults && (
            <div className="text-center py-16 text-muted-foreground">
                <p className="font-semibold">No results found for "{searchTerm}"</p>
            </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Quick to Know About Omuto
            </h1>
            <p className="text-muted-foreground">
            A knowledge hub to help you learn and share accurate information about Omuto Foundation.
            </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </>
            ) : (
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Page
                </Button>
            )
          )}
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download as PDF
          </Button>
        </div>
      </header>
       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder="Search knowledge hub..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      
      <div ref={contentRef} className="space-y-8">
        {renderContent()}
      </div>
    </div>
  );
}

