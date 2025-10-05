'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, Briefcase, Calendar, HandCoins, Image as ImageIcon } from 'lucide-react';
import { quickStats } from '@/lib/data';

const icons = {
    "Active Schools": School,
    "Students Engaged": Users,
    "Projects Running": Briefcase,
    "Events this Month": Calendar,
    "Funds Raised (Cycle of Dignity)": HandCoins,
    "New Media Uploads": ImageIcon,
};

export function QuickStatsSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {quickStats.map((stat) => {
        const Icon = icons[stat.title as keyof typeof icons] || Briefcase;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
