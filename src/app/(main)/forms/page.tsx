
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
    title: 'General M&E',
    forms: [
      { href: '/forms/program-logs/general', title: 'General Activity Log (ROI)', description: 'Report any field activity and calculate its ROI.', icon: BarChart3 },
      { href: '/forms/attendance', title: 'Session Attendance', description: 'Track participants reached in any session or event.', icon: Users },
      { href: '/forms/beneficiary-registration', title: 'Beneficiary Registration', description: 'Create a new profile for a program beneficiary.', icon: UserPlus },
      { href: '/record-testimony', title: 'Impact Story Capture', description: 'Record a success story with media.', icon: Video },
    ]
  },
   {
    title: 'Program-Specific Logs',
    forms: [
      { href: '/forms/program-logs/red-campaign', title: 'RED Campaign Log', description: 'Log activities for the RED Campaign.', icon: Heart },
      { href: '/forms/program-logs/greenschools', title: 'GreenSchools Log', description: 'Log activities for the GreenSchools Campaign.', icon: Leaf },
      { href: '/forms/program-logs/yoskills', title: 'YoSkills Hub', description: 'Access all forms related to YoSkills circles.', icon: Zap },
      { href: '/forms/program-logs/slf', title: 'Student Leaders Forum Hub', description: 'Manage schools, prefects, and performance.', icon: Users },
    ]
  },
  {
    title: 'Omuto Talents',
    forms: [
      { href: '/forms/talents/ofa', title: 'Omuto Football Alliance (OFA)', description: 'Manage league players and match reports.', icon: Trophy },
      { href: '/forms/talents/omuto-cup', title: 'Omuto Cup Event', description: 'Manage tournament registrations and results.', icon: Trophy },
    ]
  },
  {
    title: 'Social Enterprises',
    forms: [
       { href: '/essentials', title: 'Omuto Essentials', description: 'Manage production, sales, and inventory.', icon: Store },
       { href: '/pulse', title: 'Omuto Pulse', description: 'Submit content for the media platform.', icon: Wind },
    ]
  },
  {
    title: 'Partnerships & Community',
    forms: [
      { href: '/management/partnerships', title: 'Partner Registration', description: 'Add a new partner to the pipeline.', icon: Handshake },
      { href: '/forms/community/feedback', title: 'Community Feedback Form', description: 'Log complaints, suggestions, or appreciation.', icon: MessageSquare },
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
