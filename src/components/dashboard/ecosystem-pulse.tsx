
'use client';

import { useMemo } from 'react';
import type { Activity, Program } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Zap, Leaf } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EcosystemPulseProps {
    activities: Activity[] | null;
    programs: Program[] | null;
    isLoading: boolean;
}

export function EcosystemPulse({ activities, programs, isLoading }: EcosystemPulseProps) {

    const stats = useMemo(() => {
        if (!activities || !programs) {
            return { inspire: 0, equip: 0, sustain: 0 };
        }

        const inspire = programs.filter(p => p.status === 'On Track').length;
        
        const equip = activities.filter(a => a.ecosystem_phase === 'Equip & Empower').length;

        const sustain = activities
            .filter(a => a.ecosystem_phase === 'Activate & Sustain')
            .reduce((sum, act) => sum + act.totalValue, 0);

        return { inspire, equip, sustain };

    }, [activities, programs]);

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Ecosystem Pulse
                </CardTitle>
                <CardDescription>Health of our Inspire-Equip-Sustain model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                        <Leaf className="h-6 w-6 text-green-500" />
                        <div>
                            <p className="font-semibold">Inspire</p>
                            <p className="text-xs text-muted-foreground">Active Programs</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.inspire}</p>
                </div>
                 <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-blue-500" />
                        <div>
                            <p className="font-semibold">Equip & Empower</p>
                            <p className="text-xs text-muted-foreground">Youth Activities Logged</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.equip}</p>
                </div>
                 <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                        <div>
                            <p className="font-semibold">Activate & Sustain</p>
                            <p className="text-xs text-muted-foreground">Value Generated</p>
                        </div>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(stats.sustain, true)}</p>
                </div>
            </CardContent>
        </Card>
    )
}
