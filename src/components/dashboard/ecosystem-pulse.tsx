
'use client';

import { useMemo } from 'react';
import type { Activity, Program } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Zap, Leaf, Activity as ActivityIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';

interface EcosystemPulseProps {
    activities: Activity[] | null;
    programs: Program[] | null;
    isLoading: boolean;
}

export function EcosystemPulse({ activities, programs, isLoading }: EcosystemPulseProps) {

    const stats = useMemo(() => {
        if (!activities || !programs) {
            return { inspire: 0, equip: 0, sustain: 0, total: 0 };
        }

        const inspire = programs.filter(p => p.status === 'On Track').length;
        const equip = activities.filter(a => a.ecosystem_phase === 'Equip & Empower').length;
        const sustain = activities
            .filter(a => a.ecosystem_phase === 'Activate & Sustain')
            .reduce((sum, act) => sum + act.totalValue, 0);

        return { inspire, equip, sustain, total: activities.length };

    }, [activities, programs]);

    if (isLoading) {
        return <Skeleton className="h-96 rounded-[2rem]" />
    }

    return (
        <Card className="rounded-[2rem] border-none shadow-2xl shadow-muted/20 overflow-hidden bg-card">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <ActivityIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Ecosystem Pulse</CardTitle>
                        <CardDescription className="font-medium text-xs">Model Health & Impact Velocity</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-green-500/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500 group-hover:scale-110 transition-transform">
                                    <Leaf className="h-5 w-5" />
                                </div>
                                <p className="font-bold text-sm">Phase 1: Inspire</p>
                            </div>
                            <p className="text-2xl font-black text-green-600 leading-none">{stats.inspire}</p>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Active Programs</span>
                                <span>On Track</span>
                            </div>
                            <Progress value={85} className="h-1.5 bg-muted" />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <p className="font-bold text-sm">Phase 2: Equip</p>
                            </div>
                            <p className="text-2xl font-black text-blue-600 leading-none">{stats.equip}</p>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Activities Logged</span>
                                <span>Engagement</span>
                            </div>
                            <Progress value={60} className="h-1.5 bg-muted" />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-yellow-500/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:scale-110 transition-transform">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <p className="font-bold text-sm">Phase 3: Sustain</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-yellow-600 leading-none">{formatCurrency(stats.sustain, true)}</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Value Generated</span>
                                <span>ROI Efficiency</span>
                            </div>
                            <Progress value={75} className="h-1.5 bg-muted" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
