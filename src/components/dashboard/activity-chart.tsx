'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { weeklyActivityData } from '@/lib/data';
import { ChartTooltipContent } from '@/components/ui/chart';

export function ActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity Breakdown</CardTitle>
        <CardDescription>
          A summary of key activities logged this week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyActivityData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Bar dataKey="GirlChildDay" name="Girl Child Day" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="TreePlanting" name="Tree Planting" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="PTAMeeting" name="PTA Meeting" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
