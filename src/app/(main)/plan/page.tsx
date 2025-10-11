
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  nonNegotiableGoals,
  flexibleTargets,
} from '@/lib/data';
import { CheckCircle2, Clock, Users, BarChart2 } from 'lucide-react';
import { TeamRoles } from '@/components/plan/team-roles';
import { KeyResultsTracker } from '@/components/plan/key-results-tracker';

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          October 2025 Operational Plan
        </h1>
        <p className="text-muted-foreground">
          Building Our Foundation for Scale.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Non-Negotiables</CardTitle>
            <CardDescription>
              Our must-win battles that create the foundation for everything
              else.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nonNegotiableGoals.map((goal, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                  <p className="mt-1 text-xs font-medium">{goal.details}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Flexible Targets</CardTitle>
            <CardDescription>
              Important but adjustable goals we pursue within available
              capacity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flexibleTargets.map((goal, index) => (
              <div key={index} className="flex items-start gap-4">
                <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TeamRoles />
        <KeyResultsTracker />
      </div>

    </div>
  );
}
