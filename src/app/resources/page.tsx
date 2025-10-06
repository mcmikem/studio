'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Handshake } from 'lucide-react';

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
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <Handshake className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Donor & Funding Pipeline
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Here you will find tools for tracking donor engagement, managing
              grant proposals, and monitoring funding pipelines to ensure Omuto's
              financial health.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
