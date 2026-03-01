
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ArrowRight, BookOpen, Droplets, Wind, Leaf, Hand, Heart, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';

const mealSections = [
    {
        title: 'Cross-Programmatic Data',
        description: 'Forms and data points that apply to all our work.',
        links: [
            { href: '/meal/beneficiary-registration', title: 'Register Beneficiary', icon: Hand },
            { href: '/meal/attendance', title: 'Log General Attendance', icon: FileText },
            { href: '/meal/record-testimony', title: 'Capture Impact Story', icon: BookOpen },
        ]
    },
    {
        title: 'Program-Specific Data',
        description: 'Data collection forms tailored for each of Omuto\'s core programs.',
        links: [
            { href: '/meal/red-campaign', title: 'RED Campaign', icon: Droplets, color: 'text-red-500' },
            { href: '/meal/greenschools', title: 'Green Schools', icon: Leaf, color: 'text-green-500' },
            { href: '/meal/purewater', title: 'PureWater', icon: Wind, color: 'text-blue-500' },
            { href: '/meal/slf', title: 'SLF', icon: Briefcase, color: 'text-yellow-500' },
            { href: '/meal/yoskills', title: 'YoSkills', icon: Heart, color: 'text-purple-500' },
            { href: '/meal/ofa', title: 'OFA', icon: BarChart, color: 'text-orange-500' },
            { href: '/meal/yap', title: 'YAP', icon: Briefcase, color: 'text-indigo-500' },
            { href: '/meal/omuto-cup', title: 'Omuto Cup', icon: BarChart, color: 'text-teal-500' },
        ]
    }
];


export default function MealHubPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        icon={BarChart}
        title="MEAL Hub"
        description="Central hub for all Monitoring, Evaluation, Accountability, and Learning data collection forms."
      />
      
      {mealSections.map(section => (
        <Card key={section.title} className="bg-background border-lg shadow-comic-sm">
            <CardHeader>
                <CardTitle className="tracking-tighter">{section.title}</CardTitle>
                <CardDescription className="font-bold uppercase text-xs tracking-widest">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.links.map(link => (
                <Link key={link.href} href={link.href} className="block group">
                    <div className="flex items-center gap-4 p-4 border-lg rounded-2xl bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all h-full">
                        <div className={`p-3 bg-white rounded-xl border-lg ${(link as any).color ? `${(link as any).color}/10` : 'border-muted'}`}>
                            <link.icon className={`h-6 w-6 ${(link as any).color || 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold tracking-tight">{link.title}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                ))}
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
