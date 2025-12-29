
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BarChart3, Users, CheckCircle, FileText, Swords } from 'lucide-react';
import Link from 'next/link';

const dataHubSections = [
    {
        title: 'Core M&E Data',
        links: [
            {
                href: '/data/beneficiaries',
                title: 'Beneficiary Database',
                description: 'View and manage all registered program beneficiaries.',
                icon: Users,
            },
            {
                href: '/data/attendance',
                title: 'Attendance Records',
                description: 'Browse all submitted attendance sheets from events and sessions.',
                icon: CheckCircle,
            },
            {
                href: '/data/surveys',
                title: 'Survey Results',
                description: 'Analyze baseline and endline survey data to measure impact.',
                icon: FileText,
            },
        ]
    },
    {
        title: 'Program-Specific Data',
        links: [
            {
                href: '/data/ofa',
                title: 'Omuto Football Alliance (OFA)',
                description: 'Access all data related to OFA teams, players, matches, and performance.',
                icon: Swords,
            },
        ]
    }
];

export default function DataHubPage() {
  return (
    <div className="space-y-8">
      <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-8 w-8" /> Data Hub</h1>
          <p className="text-muted-foreground">Your central place for viewing and analyzing all collected data.</p>
      </header>
      
      {dataHubSections.map(section => (
        <Card key={section.title}>
            <CardHeader>
                <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.links.map(link => (
                <Link key={link.href} href={link.href} className="block">
                    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                        <link.icon className="h-8 w-8 text-primary flex-shrink-0" />
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
      ))}
    </div>
  );
}
