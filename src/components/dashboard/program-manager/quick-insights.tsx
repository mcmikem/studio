
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, BarChart } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Activity } from "@/lib/types";
import { useMemo } from "react";
import { subWeeks, startOfWeek, isAfter } from "date-fns";

export function QuickInsights({ activities }: { activities: Activity[] | null }) {
    
    const { chartData, weeklyTotal, trend } = useMemo(() => {
        if (!activities) {
            return { chartData: [], weeklyTotal: 0, trend: 0 };
        }

        const now = new Date();
        const sixWeeksAgo = startOfWeek(subWeeks(now, 5)); // Include current week + 5 past weeks
        const lastWeekStart = startOfWeek(subWeeks(now, 1));
        const twoWeeksAgoStart = startOfWeek(subWeeks(now, 2));

        const recentActivities = activities.filter(act => 
            act.loggedAt && isAfter(act.loggedAt.toDate(), sixWeeksAgo)
        );

        // Group by week
        const weeklyCounts = recentActivities.reduce((acc, act) => {
            const weekStart = startOfWeek(act.loggedAt.toDate()).toISOString().split('T')[0];
            if (!acc[weekStart]) {
                acc[weekStart] = 0;
            }
            acc[weekStart]++;
            return acc;
        }, {} as Record<string, number>);

        const sortedWeeks = Object.keys(weeklyCounts).sort();

        const chartData = sortedWeeks.map((week, index) => ({
            week: `W${index + 1}`,
            activities: weeklyCounts[week],
        }));

        const thisWeekCount = weeklyCounts[startOfWeek(now).toISOString().split('T')[0]] || 0;
        const lastWeekCount = weeklyCounts[lastWeekStart.toISOString().split('T')[0]] || 0;
        
        const trend = thisWeekCount - lastWeekCount;

        return { chartData, weeklyTotal: thisWeekCount, trend };

    }, [activities]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart /> Quick Insights</CardTitle>
                <CardDescription>Key performance indicators at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Field Activity Trend</p>
                    <div className="flex items-baseline gap-2">
                         <p className="text-2xl font-bold">{weeklyTotal} Activities</p>
                         <p className={`text-sm font-bold flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <TrendingUp className="h-4 w-4" /> {trend >= 0 ? '+' : ''}{trend} from last week
                        </p>
                    </div>
                </div>
                 <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                }}
                                labelFormatter={(label) => `Week ${chartData[label as number]?.week}`}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="activities" 
                                stroke="hsl(var(--primary))" 
                                fillOpacity={1} 
                                fill="url(#colorActivities)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-muted rounded-md">
                        <p className="text-xl font-bold">45<span className="text-sm font-normal">h</span></p>
                        <p className="text-xs text-muted-foreground">Volunteer Hours</p>
                    </div>
                     <div className="p-2 bg-muted rounded-md">
                        <p className="text-xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">Media Pieces Ready</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
