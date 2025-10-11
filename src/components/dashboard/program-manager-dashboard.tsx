
"use client"

import type { User, Program, Partnership, Checkout } from "@/lib/types"
import { Alerts } from "./alerts"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardHeader } from "./dashboard-header"
import { KeyResultsTracker } from "../plan/key-results-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { ArrowRight, CheckCircle, CircleDot, UserX } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import Link from "next/link"
import { useMemo } from "react"
import { Skeleton } from "../ui/skeleton"

function TeamCoordination() {
    // This is placeholder data. In a real app, this would come from live check-in/task data.
    const teamStatus = [
        { name: 'Bwire', task: 'Tree planting @ Kibibi SS', status: 'on-track' },
        { name: 'Kasirye', task: 'Girl Day prep @ Makerere', status: 'on-track' },
        { name: 'Alex', task: 'Editing documentary (2h overdue)', status: 'at-risk' },
        { name: 'McMike', task: 'Not checked in today', status: 'off-track' },
    ];

    const statusIcons = {
        'on-track': <CheckCircle className="h-4 w-4 text-green-500" />,
        'at-risk': <CircleDot className="h-4 w-4 text-yellow-500" />,
        'off-track': <UserX className="h-4 w-4 text-red-500" />
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>👥 Team Coordination</CardTitle>
                <CardDescription>Live status of team deployment and resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Team Deployment</h4>
                    <div className="space-y-3">
                    {teamStatus.map(member => (
                        <div key={member.name} className="flex items-center gap-2">
                            {statusIcons[member.status as keyof typeof statusIcons]}
                            <span className="font-medium">{member.name}</span>
                            <span className="text-muted-foreground truncate">- {member.task}</span>
                        </div>
                    ))}
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Resource Alerts</h4>
                    <div className="p-3 bg-muted rounded-md text-sm">
                        <p>• Transport budget: <span className="font-bold">65% used</span></p>
                        <p>• Volunteer gap: <span className="font-bold text-red-500">Need 5 more for Friday</span></p>
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
}

function PartnershipPipeline({ partnerships, isLoading }: { partnerships: Partnership[] | null, isLoading: boolean }) {
    
    const { hotCount, warmCount, coldCount, urgentItem, upcomingItem } = useMemo(() => {
        if (!partnerships) {
            return { hotCount: 0, warmCount: 0, coldCount: 0, urgentItem: null, upcomingItem: null };
        }

        const hot = partnerships.filter(p => p.status === 'Potential').length;
        const warm = partnerships.filter(p => p.status === 'Active').length;
        const cold = partnerships.filter(p => p.status === 'Inactive').length;

        // Simple logic for urgent/upcoming. A real app might use dates or keywords.
        const urgent = partnerships.find(p => p.nextStep.toLowerCase().includes('mou'))
        const upcoming = partnerships.find(p => p.nextStep.toLowerCase().includes('meeting') || p.nextStep.toLowerCase().includes('call'))

        return { hotCount: hot, warmCount: warm, coldCount: cold, urgentItem: urgent, upcomingItem: upcoming };

    }, [partnerships]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>🤝 Partnership Pipeline</CardTitle>
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
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/management/partnerships">
                        Manage All Partnerships <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function QuickInsights() {
    // Placeholder data
    return (
        <Card>
            <CardHeader>
                <CardTitle>📊 Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div className="p-2 bg-muted rounded-md">
                    <p className="text-2xl font-bold">12 <span className="text-sm text-green-500">(+3)</span></p>
                    <p className="text-xs text-muted-foreground">Field Activities this week</p>
                </div>
                 <div className="p-2 bg-muted rounded-md">
                    <p className="text-2xl font-bold">45<span className="text-sm font-normal">h</span></p>
                    <p className="text-xs text-muted-foreground">Volunteer Hours</p>
                </div>
                 <div className="p-2 bg-muted rounded-md">
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground">Media Pieces Ready</p>
                </div>
                 <div className="p-2 bg-muted rounded-md">
                    <p className="text-2xl font-bold">30<span className="text-sm font-normal">%</span></p>
                    <p className="text-xs text-muted-foreground">Community-Led</p>
                </div>
            </CardContent>
        </Card>
    )
}


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);
  
  return (
     <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
       <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <KeyResultsTracker title="October Plan Execution" showAtRisk anmouncement />
            <TeamCoordination />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
            <QuickInsights />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}

    