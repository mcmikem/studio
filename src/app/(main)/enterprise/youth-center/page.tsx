
'use client';

import { Suspense } from 'react';
import { Loader2, Printer, Brush, BookOpen, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const youthCenterLinks = [
  {
    href: '/enterprise/youth-center/printing',
    title: 'Printing Jobs',
    description: 'Manage and track all printing service requests.',
    icon: Printer,
  },
  {
    href: '/enterprise/youth-center/design-projects',
    title: 'Design Projects',
    description: 'Manage branding and design projects for clients.',
    icon: Brush,
  },
  {
    href: '/enterprise/youth-center/courses',
    title: 'Courses',
    description: 'Manage short courses and holiday intensives.',
    icon: BookOpen,
  },
  {
    href: '/enterprise/youth-center/students',
    title: 'Students',
    description: 'View and manage all enrolled students.',
    icon: Users,
  },
];

function YouthCenterHubPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/enterprise">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Enterprise Hub
                    </Link>
                </Button>
                <h1 className="font-heading text-3xl font-bold tracking-tight">Omuto Youth Center</h1>
                <p className="text-muted-foreground">
                    Manage services like printing, design, and short courses.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Youth Center Modules</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {youthCenterLinks.map(link => (
                         <Link key={link.href} href={link.href} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                <link.icon className="h-8 w-8 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{link.title}</p>
                                    <p className="text-sm text-muted-foreground">{link.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default function YouthCenterPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <YouthCenterHubPage />
        </Suspense>
    )
}
