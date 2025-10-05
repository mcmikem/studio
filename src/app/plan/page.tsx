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
  teamRoles,
  successMetrics,
} from '@/lib/data';
import { CheckCircle2, Clock } from 'lucide-react';

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

      <Card>
        <CardHeader>
          <CardTitle>Team Roles & Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Primary Focus</TableHead>
                <TableHead>Key October Deliverables</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamRoles.map((role, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{role.member}</TableCell>
                  <TableCell>{role.focus}</TableCell>
                  <TableCell>{role.deliverables}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Success Dashboard</CardTitle>
          <CardDescription>
            How we measure success beyond the numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Green Zone (&gt;80%)</TableHead>
                <TableHead>Yellow Zone (50-80%)</TableHead>
                <TableHead>Red Zone (&lt;50%)</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {successMetrics.map((metric, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{metric.metric}</TableCell>
                  <TableCell><Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500">{metric.green}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="border-yellow-500 bg-yellow-500/10 text-yellow-500">{metric.yellow}</Badge></TableCell>
                  <TableCell><Badge variant="destructive">{metric.red}</Badge></TableCell>
                  <TableCell>{metric.response}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
