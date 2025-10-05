'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Resource Mobilization
        </h1>
        <p className="text-muted-foreground">
          Manage donor relations, funding opportunities, and proposals.
        </p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
                The Resource Mobilization dashboard is currently under development.
            </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <Handshake className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Tools for tracking donors, proposals, and funding alerts will be available here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
