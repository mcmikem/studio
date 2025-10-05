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
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Moderate": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "At Risk": "border-red-500 bg-red-500/10 text-red-500",
    "Delayed": "border-orange-500 bg-orange-500/10 text-orange-500",
};

export function ProjectsOverview({ isLoading = true }: { isLoading?: boolean }) {
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
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No projects to display. Connect to a data source.
                </TableCell>
              </TableRow>
            )}
            {/* Live data will be mapped here */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
