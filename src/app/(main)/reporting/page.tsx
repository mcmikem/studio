'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Download, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ReportingPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8" />
          Automated Reporting
        </h1>
        <p className="text-muted-foreground">
          Generate, view, and download recurring operational reports.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Select a report type and time period to generate a summary. This feature is under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <label htmlFor="report-type" className="text-sm font-medium">Report Type</label>
                <Select defaultValue="weekly-summary">
                    <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select a report..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly-summary">Weekly Team Summary</SelectItem>
                        <SelectItem value="monthly-financial">Monthly Financial Overview</SelectItem>
                        <SelectItem value="quarterly-impact">Quarterly Impact Report</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label htmlFor="report-period" className="text-sm font-medium">Time Period</label>
                 <Select defaultValue="last-week">
                    <SelectTrigger id="report-period">
                        <SelectValue placeholder="Select a period..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-end">
                <Button className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Generate & Download
                </Button>
            </div>
          </div>
           <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Automated Summaries Coming Soon
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              This section will soon house automatically generated reports that summarize team activities, financial spending, and impact metrics over time, ready for sharing with partners and stakeholders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
