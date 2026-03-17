
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, LogOut, Receipt, Megaphone, Wand, BarChart3, Bug, MessageSquare, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const formSections = [
  {
    title: 'Daily Operations',
    forms: [
      { href: '/daily-plan', title: 'AI Daily Planner', description: 'Plan your day with AI assistance.', icon: Wand },
      { href: '/workplan', title: 'Weekly Goals', description: 'Set and track weekly objectives.', icon: BarChart3 },
    ]
  },
  {
    title: 'Enterprise & Sales',
    forms: [
      { href: '/enterprise/essentials/products', title: 'Products', description: 'Manage products inventory.', icon: Package },
      { href: '/enterprise/essentials/sales', title: 'Point of Sale', description: 'Record sales transactions.', icon: ShoppingCart },
      { href: '/enterprise/essentials/production', title: 'Production', description: 'Log production batches.', icon: TrendingUp },
    ]
  },
  {
    title: 'Financial & Admin',
    forms: [
      { href: '/forms/expense', title: 'Expense Report', description: 'Submit expense or request funds.', icon: Receipt },
      { href: '/enterprise/essentials/feedback', title: 'Customer Feedback', description: 'Log customer feedback.', icon: MessageSquare },
    ]
  },
  {
    title: 'System',
    forms: [
        { href: '/system/feedback', title: 'Report Issue', description: 'Report bugs or suggest features.', icon: Bug },
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
