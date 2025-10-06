import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Reports
        </h1>
        <p className="text-muted-foreground">
          View and download automatically generated reports.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The automated reporting feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Automated Reporting
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              This section will allow you to generate and download automated
              reports on program progress, financial summaries, and team
              performance, powered by the data you enter into the app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
