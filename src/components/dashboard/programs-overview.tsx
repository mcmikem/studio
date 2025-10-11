
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Program } from '@/lib/types';
import { Briefcase, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const chartColors: { [key: string]: string } = {
  "On Track": "hsl(var(--chart-2))",
  "At Risk": "hsl(var(--chart-3))",
  "Delayed": "hsl(var(--chart-1))",
  "Completed": "hsl(var(--muted))",
};


export function ProgramsOverview({ programs }: { programs: Program[] | null }) {

  const programStats = useMemo(() => {
    if (!programs) {
      return {
        onTrack: 0,
        atRisk: 0,
        delayed: 0,
        total: 0,
        chartData: [],
      };
    }
    const stats = programs.reduce((acc, program) => {
        if (program.status === 'On Track') acc.onTrack++;
        else if (program.status === 'At Risk') acc.atRisk++;
        else if (program.status === 'Delayed') acc.delayed++;
        return acc;
    }, { onTrack: 0, atRisk: 0, delayed: 0 });

    const chartData = [
      { name: 'On Track', value: stats.onTrack, fill: chartColors['On Track'] },
      { name: 'At Risk', value: stats.atRisk, fill: chartColors['At Risk'] },
      { name: 'Delayed', value: stats.delayed, fill: chartColors['Delayed'] },
    ].filter(d => d.value > 0);

    return { ...stats, total: programs.filter(p => p.status !== 'Completed').length, chartData };
  }, [programs]);

  return (
    <Card>
      <CardHeader>
          <CardTitle className="text-xl">Active Programs Overview</CardTitle>
          <CardDescription>
            A real-time health check of our key initiatives.{' '}
            <Link href="/management/programs" className="text-primary hover:underline">Manage All Programs</Link>
          </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="md:col-span-1 grid grid-cols-1 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">On Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{programStats.onTrack}</div>
                        <p className="text-xs text-muted-foreground">of {programStats.total} active programs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{programStats.atRisk}</div>
                         <p className="text-xs text-muted-foreground">of {programStats.total} active programs</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{programStats.delayed}</div>
                         <p className="text-xs text-muted-foreground">of {programStats.total} active programs</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Chart */}
            <div className="md:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Program Health Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {programStats.chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                <Tooltip
                                    cursor={false}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Pie
                                    data={programStats.chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    paddingAngle={5}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={3}
                                >
                                    {programStats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                         )}
                         {programStats.chartData.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                                <Briefcase className="h-12 w-12" />
                                <p className="mt-4 font-semibold">No Active Programs Found</p>
                                <p className="text-sm">Add a program in the management section to see stats here.</p>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>
         </div>
      </CardContent>
    </Card>
  );
}
