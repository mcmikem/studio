
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ArrowRight, School, User, CheckSquare, BarChart } from 'lucide-react';
import Link from 'next/link';

const slfForms = [
    { href: '/meal/slf/school-registration', title: 'School Registration', description: 'Register a new school for the SLF program.', icon: School },
    { href: '/meal/slf/prefect-registration', title: 'Prefect Registration', description: 'Register a new prefect for the SLF program.', icon: User },
    { href: '/meal/slf/training-attendance', title: 'Training Attendance', description: 'Log attendance for an SLF training session.', icon: CheckSquare },
    { href: '/meal/slf/performance-tracking', title: 'Performance Tracking', description: 'Track the performance of a prefect.', icon: BarChart },
];

export default function SlfHubPage() {
  return (
    <div className="space-y-8">
        <PageHeader 
            icon={Briefcase}
            title="Student Leaders Fellowship"
            description="Data collection for the SLF program."
            breadcrumbs={[
                { name: 'Dashboard', href: '/main' },
                { name: 'SLF', href: '/meal/slf' },
              ]}
              
        />

        <Card className="bg-background border-lg shadow-comic-sm">
            <CardHeader>
                <CardTitle>Data Collection Forms</CardTitle>
                <CardDescription>Select a form to log data for the SLF program.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slfForms.map(link => (
                    <Link key={link.href} href={link.href} className="block group">
                        <div className="flex items-center gap-4 p-4 border-lg rounded-2xl bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all h-full">
                            <div className="p-3 bg-white rounded-xl border-lg">
                                <link.icon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold tracking-tight">{link.title}</p>
                                <p className="text-sm text-muted-foreground">{link.description}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
