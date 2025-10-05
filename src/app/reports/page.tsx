import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Automated reports will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
