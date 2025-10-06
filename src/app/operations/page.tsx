'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function OperationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Operations & Field
        </h1>
        <p className="text-muted-foreground">
          Coordinate all field operations, logistics, and school relations.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Operations & Field dashboard is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <Truck className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Field Operations Hub
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              This module will provide tools for managing field schedules,
              logistics, school data, and volunteer coordination.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
