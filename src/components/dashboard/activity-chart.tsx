'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { weeklyActivityData } from '@/lib/data';
import { ChartTooltipContent, ChartContainer, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  GirlChildDay: {
    label: "Girl Child Day",
    color: "hsl(var(--primary))",
  },
  TreePlanting: {
    label: "Tree Planting",
    color: "hsl(var(--accent))",
  },
  PTAMeeting: {
    label: "PTA Meeting",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

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
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
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
              <Bar dataKey="GirlChildDay" name="Girl Child Day" fill="var(--color-GirlChildDay)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TreePlanting" name="Tree Planting" fill="var(--color-TreePlanting)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PTAMeeting" name="PTA Meeting" fill="var(--color-PTAMeeting)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
