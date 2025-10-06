
'use client';

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
import { Progress } from '@/components/ui/progress';
import { projects } from '@/lib/projects-data';
import type { Project } from '@/lib/types';
import { Truck } from 'lucide-react';

const statusColors: { [key: string]: string } = {
  Active: 'border-green-500 bg-green-500/10 text-green-500',
  Moderate: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  'At Risk': 'border-orange-500 bg-orange-500/10 text-orange-500',
  Delayed: 'border-red-500 bg-red-500/10 text-red-500',
};

export default function OperationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Operations & Field Dashboard
        </h1>
        <p className="text-muted-foreground">
          Coordinate all field operations, logistics, and school relations.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
          <CardDescription>
            A high-level view of all ongoing field projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Districts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Next Milestone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects && projects.length > 0 ? (
                projects.map((project: Project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.manager}</TableCell>
                    <TableCell>{project.districts}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[project.status]}
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.completion} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{project.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{project.nextMilestone}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="h-12 w-12" />
                      <span className="text-lg font-semibold">
                        No Projects Found
                      </span>
                      <p className="text-sm">
                        Add a project to the database to get started.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
