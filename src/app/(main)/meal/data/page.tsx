'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BarChart3, Users, CheckCircle, FileText, Swords, Leaf, Heart, Zap, Droplets, Store, Wind, Trophy } from 'lucide-react';
import Link from 'next/link';

const dataHubSections = [
    {
        title: 'Core M&E Data',
        links: [
            {
                href: '/meal/data/beneficiaries',
                title: 'Beneficiary Database',
                description: 'View and manage all registered program beneficiaries.',
                icon: Users,
            },
            {
                href: '/meal/data/attendance',
                title: 'Attendance Records',
                description: 'Browse all submitted attendance sheets from events and sessions.',
                icon: CheckCircle,
            },
            {
                href: '/meal/data/surveys',
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
                href: '/meal/data/ofa',
                title: 'Omuto Football Alliance (OFA)',
                description: 'Access all data related to OFA teams, players, matches, and performance.',
                icon: Swords,
            },
             {
                href: '/meal/data/red-campaign',
                title: 'RED Campaign',
                description: 'View MHM training, school visit, and pad distribution data.',
                icon: Heart,
            },
            {
                href: '/meal/data/greenschools',
                title: 'GreenSchools Campaign',
                description: 'Analyze tree survival surveys, waste audits, and club registrations.',
                icon: Leaf,
            },
            {
                href: '/meal/data/yoskills',
                title: 'YoSkills Entrepreneurship',
                description: 'Track circles, youth participants, business ideas, and pitch scores.',
                icon: Zap,
            },
             {
                href: '/meal/data/slf',
                title: 'Student Leaders Forum (SLF)',
                description: 'Review school registrations, prefect data, and performance reports.',
                icon: Users,
            },
             {
                href: '/meal/data/purewater',
                title: 'PureWater Initiative',
                description: 'Data for water source mapping and WASH assessments.',
                icon: Droplets,
            },
            {
                href: '/meal/data/yap',
                title: 'Youth Action Pathway (YAP)',
                description: 'Data for chapters and seed grant applications.',
                icon: Users,
            },
            {
                href: '/meal/data/essentials',
                title: 'Omuto Essentials',
                description: 'Data for production, sales, and inventory.',
                icon: Store,
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
