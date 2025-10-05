'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <Truck className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Tools for managing field schedules, logistics, and school data will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
