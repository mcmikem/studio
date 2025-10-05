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
import { projects } from '@/lib/data';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Moderate": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "At Risk": "border-red-500 bg-red-500/10 text-red-500",
    "Delayed": "border-orange-500 bg-orange-500/10 text-orange-500",
};

export function ProjectsOverview() {
  return (
    <Card>
      <CardHeader>
          <CardTitle>Active Projects Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden sm:table-cell">Manager</TableHead>
              <TableHead className="hidden md:table-cell">Districts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">% Complete</TableHead>
              <TableHead>Next Milestone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.name} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{project.manager}</TableCell>
                <TableCell className="hidden md:table-cell">{project.districts}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[project.status]}>
                    {project.status === 'Active' && '🟢'}
                    {project.status === 'Moderate' && '🟡'}
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{project.completion}%</TableCell>
                <TableCell>{project.nextMilestone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
