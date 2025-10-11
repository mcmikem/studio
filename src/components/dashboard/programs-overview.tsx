'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { Program } from '@/lib/types';
import Link from 'next/link';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Briefcase } from 'lucide-react';

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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Stats List */}
            <div className="md:col-span-1 grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full bg-[--chart-2]" />
                    <div>
                        <p className="text-muted-foreground">On Track</p>
                        <p className="font-bold text-lg">{programs ? programStats.onTrack : '...'}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full bg-[--chart-3]" />
                    <div>
                        <p className="text-muted-foreground">At Risk</p>
                        <p className="font-bold text-lg">{programs ? programStats.atRisk : '...'}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full bg-[--chart-1]" />
                    <div>
                        <p className="text-muted-foreground">Delayed</p>
                        <p className="font-bold text-lg">{programs ? programStats.delayed : '...'}</p>
                    </div>
                </div>
            </div>
            
            {/* Chart */}
            <div className="md:col-span-1 relative">
                 {programs && programStats.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
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
                            innerRadius="70%"
                            outerRadius="90%"
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
                 {programs && programStats.total > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-3xl font-bold">{programStats.total}</p>
                        <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                 )}
                 {(!programs || programStats.chartData.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
                        <Briefcase className="h-12 w-12" />
                        <p className="mt-4 font-semibold">{programs ? 'No Active Programs' : 'Loading...'}</p>
                        {programs && <p className="text-sm">Add a program to see stats.</p>}
                    </div>
                 )}
            </div>
         </div>
      </CardContent>
    </Card>
  );
}
