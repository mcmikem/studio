'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export default function MediaFinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Media & Finance
        </h1>
        <p className="text-muted-foreground">
          Manage communications, finances, and visibility.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Media & Finance dashboard is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
            <Banknote className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Financial & Media Oversight
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              This is where you'll find tools for managing media assets, expense
              reports, campaign budgets, and financial dashboards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
