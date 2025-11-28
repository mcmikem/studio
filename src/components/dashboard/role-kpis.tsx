
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle } from 'lucide-react';
import { roleKpis } from '@/lib/data';
import type { User } from '@/lib/types';
import { EmptyState } from '../ui/empty-state';

interface RoleSpecificKpisProps {
  role: User['role'];
}

export function RoleSpecificKpis({ role }: RoleSpecificKpisProps) {
  const kpis = roleKpis[role] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          My Monthly KPIs
        </CardTitle>
        <CardDescription>Key performance indicators for your role.</CardDescription>
      </CardHeader>
      <CardContent>
        {kpis.length > 0 ? (
          <div className="space-y-4">
            {kpis.map((kpi, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <div>
                    <p className="font-semibold text-sm">{kpi.title}</p>
                    <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <EmptyState
                icon={Target}
                title="No KPIs Defined"
                description="Key Performance Indicators for your role have not been set up yet."
                className="min-h-0 py-10"
            />
        )}
      </CardContent>
    </Card>
  );
}
