

'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { Copy, BookOpen, Download, Edit, Loader2, Search, MessageSquareQuote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

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

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
      });
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
    if (!searchTerm) return sections;
    const lowercasedFilter = searchTerm.toLowerCase();
    return sections?.filter(section => 
        section.title.toLowerCase().includes(lowercasedFilter) ||
        section.content.toLowerCase().includes(lowercasedFilter) ||
        section.subsections?.some(sub => sub.title.toLowerCase().includes(lowercasedFilter) || sub.content.toLowerCase().includes(lowercasedFilter))
    );
  }, [sections, searchTerm]);

  const filteredPitches = useMemo(() => {
      if (!searchTerm) return pitches;
      const lowercasedFilter = searchTerm.toLowerCase();
      return pitches?.filter(pitch =>
          pitch.title.toLowerCase().includes(lowercasedFilter) ||
          pitch.content.toLowerCase().includes(lowercasedFilter)
      );
  }, [pitches, searchTerm]);

  const filteredFaqs = useMemo(() => {
      if (!searchTerm) return faqs;
      const lowercasedFilter = searchTerm.toLowerCase();
      return faqs?.filter(faq =>
          faq.question.toLowerCase().includes(lowercasedFilter) ||
          faq.answer.toLowerCase().includes(lowercasedFilter)
      );
  }, [faqs, searchTerm]);
  
   const filteredStories = useMemo(() => {
      if (!searchTerm) return stories;
      const lowercasedFilter = searchTerm.toLowerCase();
      return stories?.filter(story =>
          story.title.toLowerCase().includes(lowercasedFilter) ||
          story.content.toLowerCase().includes(lowercasedFilter)
      );
  }, [stories, searchTerm]);


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
        {filteredSections && filteredSections.length > 0 && filteredSections.map(section => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
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
              {filteredPitches.map(pitch => (
                <div key={pitch.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{pitch.title}</h4>
                    <CopyButton text={pitch.content} />
                  </div>
                  <p className="text-sm text-muted-foreground">{pitch.content}</p>
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
              {filteredStories.map(story => (
                <div key={story.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold flex items-center gap-2"><MessageSquareQuote className="h-4 w-4 text-primary" />{story.title}</h4>
                    <CopyButton text={story.content} />
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{story.content}"</p>
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
                {filteredFaqs.map(faq => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
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
            <Button variant="outline" disabled>
              <Edit className="mr-2 h-4 w-4" /> Edit Page
            </Button>
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
