
'use client';

import * as React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { knowledgeHubData } from '@/lib/knowledge-hub-data';
import { Copy, BookOpen, Download, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const contentRef = React.useRef<HTMLDivElement>(null);

  const {
    missionAndVision,
    quickFacts,
    recentWins,
    programs,
    howToTalk,
    grantBoilerplates,
    callsToAction,
    sampleStories,
    faq,
    contactDirectory,
  } = knowledgeHubData;
  
  const canEdit = profile && ['Administrator', 'Executive Director'].includes(profile.role);

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    html2canvas(contentRef.current, {
      scale: 2, // Improve resolution
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

      <div ref={contentRef} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Mission & Vision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Mission</h3>
              <p className="text-muted-foreground">{missionAndVision.mission}</p>
            </div>
            <div>
              <h3 className="font-semibold">Vision</h3>
              <p className="text-muted-foreground">{missionAndVision.vision}</p>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{missionAndVision.paragraph}</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickFacts.map(fact => (
                <div key={fact.label} className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{fact.label}:</span>
                  <span className="font-semibold text-right">{fact.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {recentWins.map(win => <li key={win}>{win}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Programs & Projects</CardTitle>
            <CardDescription>Click to expand and learn about each initiative.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {programs.map(program => (
                <AccordionItem key={program.id} value={program.id}>
                  <AccordionTrigger className="text-base font-semibold">{program.title}</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="font-medium italic">{program.summary}</p>
                    {program.description && <p className="text-sm">{program.description}</p>}
                    {program.activities && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Key Activities:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {program.activities.map(act => <li key={act}>{act}</li>)}
                        </ul>
                      </div>
                    )}
                    {program.components && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Key Components:</h4>
                        <div className="flex flex-wrap gap-2">{program.components.map(comp => <Badge key={comp} variant="secondary">{comp}</Badge>)}</div>
                      </div>
                    )}
                    {program.impactMessage && <p className="text-sm font-bold text-primary">{program.impactMessage}</p>}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How to Talk About Omuto</CardTitle>
            <CardDescription>Copyable pitches for different audiences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {howToTalk.map(pitch => (
              <div key={pitch.title} className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{pitch.title}</h4>
                  <CopyButton text={pitch.content} />
                </div>
                <p className="text-sm text-muted-foreground">{pitch.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grant Boilerplates</CardTitle>
            <CardDescription>Standard paragraphs for grant proposals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {grantBoilerplates.map(plate => (
              <div key={plate.title} className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{plate.title}</h4>
                  <CopyButton text={plate.content} />
                </div>
                <p className="text-sm text-muted-foreground">{plate.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Impact Stories</CardTitle>
            <CardDescription>Short, powerful stories to illustrate our work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleStories.map(story => (
              <div key={story.title} className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{story.title}</h4>
                  <CopyButton text={story.content} />
                </div>
                <p className="text-sm text-muted-foreground italic">"{story.content}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
