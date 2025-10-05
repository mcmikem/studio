'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { impactMetrics } from '@/lib/data';

export function ImpactOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Overview (Real Numbers)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {impactMetrics.map((metric) => {
          const percentage = (metric.current / metric.target) * 100;
          return (
            <div key={metric.metric}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{metric.metric}</span>
                <span className="text-sm text-muted-foreground">
                  {metric.current.toLocaleString()}{metric.unit} / {metric.target.toLocaleString()}{metric.unit}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
