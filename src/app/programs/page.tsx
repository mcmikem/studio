
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { programs } from '@/lib/data';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const statusIcons: { [key: string]: React.ReactNode } = {
    "On Track": <CheckCircle2 className="h-4 w-4 text-green-500" />,
    "At Risk": <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    "Delayed": <Clock className="h-4 w-4 text-red-500" />,
    "Completed": <CheckCircle2 className="h-4 w-4 text-primary" />
};

const statusColors: { [key: string]: string } = {
    "On Track": "border-green-500 bg-green-500/10 text-green-500",
    "At Risk": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Delayed": "border-red-500 bg-red-500/10 text-red-500",
    "Completed": "border-primary bg-primary/10 text-primary",
};


export default function ProgramsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Program Tracker
        </h1>
        <p className="text-muted-foreground">
          A high-level overview of all Omuto Foundation programs and their current status.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{program.title}</CardTitle>
                <Badge variant="outline" className={statusColors[program.status]}>
                  <div className="flex items-center gap-1">
                    {statusIcons[program.status]}
                    {program.status}
                  </div>
                </Badge>
              </div>
              <CardDescription>{program.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                    <h4 className="font-semibold text-sm mb-2">Key Objectives:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {program.objectives.map((obj, index) => (
                            <li key={index}>{obj}</li>
                        ))}
                    </ul>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                        <p><strong>Lead:</strong> {program.lead}</p>
                        <p><strong>Deadline:</strong> {program.deadline}</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
