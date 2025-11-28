'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, LogIn, LogOut, Receipt, Megaphone, School, Users, UserPlus, Heart, Leaf, Zap, Trophy, Store, Wind, Handshake, MessageSquare, Bug, BarChart3, Video, FileText } from 'lucide-react';
import Link from 'next/link';

const formSections = [
  {
    title: 'Daily Routines',
    forms: [
      { href: '/daily-plan', title: 'AI Daily Planner', description: 'Plan your day and align with team goals.', icon: LogIn },
      { href: '/forms/check-out', title: 'Daily Check-out', description: 'Report your impact and share key learnings.', icon: LogOut },
    ]
  },
  {
    title: 'Financial & Admin',
    forms: [
      { href: '/forms/expense', title: 'Expense Report', description: 'Submit a new expense or request funds.', icon: Receipt },
      { href: '/forms/alert', title: 'Create Alert', description: 'Broadcast an important message to the team.', icon: Megaphone },
    ]
  },
  {
    title: 'MEAL Hub',
    forms: [
      { href: '/meal', title: 'MEAL Hub', description: 'Access all program-specific data collection forms.', icon: BarChart3 },
    ]
  },
  {
    title: 'Social Enterprise',
    forms: [
      { href: '/essentials', title: 'Omuto Essentials', description: 'Manage production, sales, and inventory.', icon: Store },
    ]
  },
  {
    title: 'Omuto Talents',
    forms: [
      { href: '/talents', title: 'Omuto Talents Hub', description: 'Manage Football, Media, and other talent programs.', icon: Trophy },
    ]
  },
   {
    title: 'System',
    forms: [
        { href: '/forms/system/feedback', title: 'System Feedback & Bug Report', description: 'Report an issue or suggest a feature.', icon: Bug },
    ]
  },
];

export default function FormsPage() {
  return (
    <div className="space-y-8">
      <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Forms Hub</h1>
          <p className="text-muted-foreground">Your central place for all data entry, reports, and logs.</p>
      </header>
      
      {formSections.map(section => (
        <Card key={section.title}>
            <CardHeader>
                <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.forms.map(link => (
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
