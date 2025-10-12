
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, FileText } from 'lucide-react';
import Link from 'next/link';


export default function ReportingPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8" />
          Reporting & Intelligence
        </h1>
        <p className="text-muted-foreground">
          Generate, view, and analyze operational data.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Reports Hub</CardTitle>
          <CardDescription>
            This section has been moved and upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Now located in "Analysis"
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              All financial and activity analysis tools are now available under the 'Analysis' tab in the main navigation.
            </p>
            <Button asChild className="mt-6">
              <Link href="/reports">Go to Analysis Page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
