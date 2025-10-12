
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SparklineChart, TrendingUp, BarChart } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";


const sampleData = [
  { week: 'W1', activities: 4 },
  { week: 'W2', activities: 3 },
  { week: 'W3', activities: 8 },
  { week: 'W4', activities: 5 },
  { week: 'W5', activities: 9 },
  { week: 'W6', activities: 12 },
];


export function QuickInsights() {
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
                         <p className="text-2xl font-bold">12 Activities</p>
                         <p className="text-sm font-bold text-green-500 flex items-center"><TrendingUp className="h-4 w-4" /> +3 from last week</p>
                    </div>
                </div>
                 <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={sampleData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                                labelFormatter={(label) => `Week ${sampleData[label as number].week}`}
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
