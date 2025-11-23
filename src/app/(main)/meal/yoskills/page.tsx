'use client';

import { Suspense } from 'react';
import { Loader2, Zap, UserPlus, Calendar, Lightbulb, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const yoskillsForms = [
  {
    href: '/meal/yoskills/circle-registration',
    title: 'Circle Registration',
    description: 'Register a new YoSkills entrepreneurship circle.',
    icon: Zap,
  },
  {
    href: '/meal/yoskills/youth-registration',
    title: 'Youth Registration',
    description: 'Add a new youth participant to a circle.',
    icon: UserPlus,
  },
  {
    href: '/meal/yoskills/session-attendance',
    title: 'Session Attendance',
    description: 'Log attendance for a specific circle session.',
    icon: Calendar,
  },
  {
    href: '/meal/yoskills/idea-submission',
    title: 'Business Idea Submission',
    description: 'Submit a new business idea from a participant.',
    icon: Lightbulb,
  },
  {
    href: '/meal/yoskills/pitch-score',
    title: 'Pitch Score Sheet',
    description: 'Score a business idea pitch from a participant.',
    icon: Trophy,
  },
  {
    href: '/meal/yoskills/business-progress',
    title: 'Business Progress Tracking',
    description: 'Log monthly progress for an active business.',
    icon: TrendingUp,
  },
];

function YoSkillsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">YoSkills Entrepreneurship Circles</h1>
                <p className="text-muted-foreground">
                    Data collection and management forms for the YoSkills program.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>YoSkills Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {yoskillsForms.map(form => (
                         <Link key={form.href} href={form.href} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                <form.icon className="h-8 w-8 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{form.title}</p>
                                    <p className="text-sm text-muted-foreground">{form.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default function YoSkillsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <YoSkillsHubPage />
        </Suspense>
    )
}
