

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

const successMetrics = [
  { metric: 'Backlog Completion', week1: '100%', week2: 'N/A', week3: 'N/A', week4: 'N/A' },
  { metric: 'Product Sales', week1: 'N/A', week2: '15 units', week3: '30 units', week4: '50+ units' },
  { metric: 'Partnership Progress', week1: 'N/A', week2: '3 meetings', week3: '2 commitments', week4: '3 commitments' },
  { metric: 'App Adoption', week1: '100%', week2: '100%', week3: '100%', week4: '100%' },
  { metric: 'Team Coordination', week1: '4.0+', week2: '4.0+', week3: '4.0+', week4: '4.5+' },
];

const accountability = [
  { member: 'Kasirye', focus: 'Products & Backlogs' },
  { member: 'Diana', focus: 'Partnerships & Coordination' },
  { member: 'Alex', focus: 'Communications' },
  { member: 'Jimmy', focus: 'Production' },
  { member: 'All Team', focus: 'App Adoption & Coordination' },
];

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          November 2025 Operational Plan
        </h1>
        <p className="text-muted-foreground">
          "Complete, Launch, Prepare"
        </p>
      </header>

       <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strategic Objectives</CardTitle>
            <CardDescription>
              Our high-level goals for the month.
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
        <Card>
            <CardHeader>
                <CardTitle>Accountability</CardTitle>
                <CardDescription>Primary owners for November's key focus areas.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Member</TableHead>
                            <TableHead>Focus Area</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accountability.map(item => (
                            <TableRow key={item.member}>
                                <TableCell className="font-medium">{item.member}</TableCell>
                                <TableCell>{item.focus}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6">
        <div className="col-span-1">
            <KeyResultsTracker />
        </div>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle>Weekly Health Dashboard</CardTitle>
            <CardDescription>Success metrics and progress tracking for November.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Week 1 Target</TableHead>
                        <TableHead>Week 2 Target</TableHead>
                        <TableHead>Week 3 Target</TableHead>
                        <TableHead>Week 4 Target</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {successMetrics.map((metric) => (
                        <TableRow key={metric.metric}>
                            <TableCell className="font-medium">{metric.metric}</TableCell>
                            <TableCell>{metric.week1}</TableCell>
                            <TableCell>{metric.week2}</TableCell>
                            <TableCell>{metric.week3}</TableCell>
                            <TableCell>{metric.week4}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
       </Card>

    </div>
  );
}
