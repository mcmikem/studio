
'use client';

import { useMemo } from 'react';
import type { Partnership } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Handshake } from 'lucide-react';

export function PartnershipPipeline({ partnerships, isLoading }: { partnerships: Partnership[] | null, isLoading: boolean }) {
    
    const { hotCount, warmCount, coldCount, urgentItem, upcomingItem } = useMemo(() => {
        if (!partnerships) {
            return { hotCount: 0, warmCount: 0, coldCount: 0, urgentItem: null, upcomingItem: null };
        }

        const hot = partnerships.filter(p => p.status === 'Potential').length;
        const warm = partnerships.filter(p => p.status === 'Active').length;
        const cold = partnerships.filter(p => p.status === 'Inactive').length;

        const urgentKeywords = ['deadline', 'report', 'due', 'mou'];
        const upcomingKeywords = ['meeting', 'call', 'follow-up', 'proposal', 'submit', 'draft'];

        const activeOrPotential = partnerships.filter(p => p.status !== 'Inactive');
        
        let urgent = null;
        for (const p of activeOrPotential) {
            if (urgentKeywords.some(kw => p.nextStep.toLowerCase().includes(kw))) {
                urgent = p;
                break;
            }
        }
        
        let upcoming = null;
        if (!urgent) {
            for (const p of activeOrPotential) {
                if (upcomingKeywords.some(kw => p.nextStep.toLowerCase().includes(kw))) {
                    upcoming = p;
                    break;
                }
            }
        }

        return { hotCount: hot, warmCount: warm, coldCount: cold, urgentItem: urgent, upcomingItem: upcoming };

    }, [partnerships]);

    return (
        <Card className="hover:bg-muted/50 transition-colors group/card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Handshake /> Partnership Pipeline</CardTitle>
                <CardDescription>A snapshot of your current partner engagement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-12 w-full" /> : (
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold">{hotCount}</p>
                            <p className="text-sm text-muted-foreground">Hot</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{warmCount}</p>
                            <p className="text-sm text-muted-foreground">Warm</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{coldCount}</p>
                            <p className="text-sm text-muted-foreground">Cold</p>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </>
                    ) : (
                        <>
                        {urgentItem && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                <p className="text-xs font-semibold text-red-600">URGENT</p>
                                <p className="text-sm font-medium">{urgentItem.name} - {urgentItem.nextStep}</p>
                            </div>
                        )}
                        {upcomingItem && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                <p className="text-xs font-semibold text-blue-600">UPCOMING</p>
                                <p className="text-sm font-medium">{upcomingItem.name} - {upcomingItem.nextStep}</p>
                            </div>
                        )}
                        {!urgentItem && !upcomingItem && (
                            <div className="p-3 text-center text-sm text-muted-foreground">No urgent action items in the pipeline.</div>
                        )}
                        </>
                    )}
                </div>
            </CardContent>
             <CardFooter>
                <Button asChild className="w-full" variant="ghost">
                    <Link href="/management/partnerships" className="text-sm text-primary group-hover/card:underline flex items-center justify-end w-full">
                        Manage All Partnerships <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
