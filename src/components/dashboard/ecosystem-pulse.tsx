
'use client';

import { useMemo } from 'react';
import type { Activity, Program } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Zap, Leaf, Activity as ActivityIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';

export function EcosystemPulse() {
    const firestore = useFirestore();
    
    const activitiesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'), limit(100));
    }, [firestore]);
    
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), limit(50));
    }, [firestore]);

    const { data: activities, isLoading: isActivitiesLoading } = useCollection<Activity>(activitiesQuery);
    const { data: programs, isLoading: isProgramsLoading } = useCollection<Program>(programsQuery);
    
    const isLoading = isActivitiesLoading || isProgramsLoading;

    const stats = useMemo(() => {
        if (!activities || !programs) {
            return { inspire: 0, equip: 0, sustain: 0, total: 0, inspireProgress: 0, equipProgress: 0, sustainProgress: 0 };
        }

        const totalPrograms = programs.length || 1;
        const inspire = programs.filter(p => p.status === 'On Track').length;
        const equip = activities.filter(a => a.ecosystem_phase === 'Equip & Empower').length;
        const sustain = activities
            .filter(a => a.ecosystem_phase === 'Activate & Sustain')
            .reduce((sum, act) => sum + (act.totalValue || 0), 0);

        const totalActivities = activities.length || 1;
        const totalValue = activities.reduce((sum, a) => sum + (a.totalValue || 0), 0) || 1;

        return {
            inspire,
            equip,
            sustain,
            total: activities.length,
            inspireProgress: Math.round((inspire / totalPrograms) * 100),
            equipProgress: Math.round((equip / totalActivities) * 100),
            sustainProgress: Math.round((sustain / totalValue) * 100),
        };

    }, [activities, programs]);

    if (isLoading) {
        return <Skeleton className="h-96 rounded-[2rem]" />
    }

    const overallHealth = Math.round((stats.inspireProgress + stats.equipProgress + stats.sustainProgress) / 3);
    const overallColor = overallHealth >= 70 ? 'bg-green-500' : overallHealth >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    const overallLabel = overallHealth >= 70 ? 'Healthy' : overallHealth >= 40 ? 'Building' : 'Critical';

    return (
        <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm overflow-hidden">
            <CardHeader className="bg-omuto-cream/50 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ActivityIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Ecosystem Pulse</CardTitle>
                            <CardDescription className="font-medium text-xs">Model Health & Impact Velocity</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl border border-omuto-navy/20 px-4 py-2 shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${overallColor} ${overallHealth >= 70 ? 'animate-pulse' : ''}`} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Overall</p>
                            <p className={`font-black text-sm ${overallHealth >= 70 ? 'text-green-600' : overallHealth >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{overallLabel}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3 h-1.5 bg-muted/50 rounded-full overflow-hidden border border-omuto-navy/10">
                    <div className={`h-full rounded-full transition-all ${overallColor}`} style={{ width: `${overallHealth}%` }} />
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
                                <span>{stats.inspireProgress}%</span>
                            </div>
                            <Progress value={stats.inspireProgress} className="h-1.5 bg-muted" />
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
                                <span>{stats.equipProgress}%</span>
                            </div>
                            <Progress value={stats.equipProgress} className="h-1.5 bg-muted" />
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
                                <span>{stats.sustainProgress}%</span>
                            </div>
                            <Progress value={stats.sustainProgress} className="h-1.5 bg-muted" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
