
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ArrowRight, Store, Printer } from 'lucide-react';
import Link from 'next/link';

const enterpriseSections = [
  {
    href: '/enterprise/essentials',
    title: 'Omuto Essentials',
    description: 'Manage products, inventory, production, and sales for physical goods.',
    icon: Store,
  },
  {
    href: '/enterprise/youth-center',
    title: 'Omuto Youth Center',
    description: 'Manage services like printing, design, and short courses.',
    icon: Printer,
  },
];

export default function EnterpriseHubPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Enterprise Hub</h1>
        <p className="text-muted-foreground">
          A unified management system for Omuto's social enterprise divisions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Divisions</CardTitle>
          <CardDescription>Select a division to manage its operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enterpriseSections.map((link) => (
            <Link key={link.href} href={link.href} className="block">
              <div className="flex items-start gap-4 p-6 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                <link.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">{link.title}</p>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
