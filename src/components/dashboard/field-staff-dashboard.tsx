
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamPulse } from "./team-activity-feed"
import { MyPriorities } from "./my-priorities"
import { DashboardGrid } from "./dashboard-grid"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit, where } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Camera, Receipt, Target } from "lucide-react"
import Link from "next/link"
import { SmartReminders } from "./smart-reminders"
import { Loader2 } from "lucide-react"

function TodaysBattlePlan() {
    const { user } = useUser();
    const firestore = useFirestore();

    const latestCheckinQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'checkins'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
    }, [user, firestore]);

    const { data: checkins, isLoading } = useCollection<Checkin>(latestCheckinQuery);
    const latestCheckin = checkins?.[0];

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="text-primary"/>
                    Today's Battle Plan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-6 w-3/4 bg-muted-foreground/20 animate-pulse rounded-md" />
                        <div className="h-4 w-1/2 bg-muted-foreground/20 animate-pulse rounded-md" />
                    </div>
                ) : latestCheckin ? (
                    <div>
                        <h3 className="text-xl font-bold">🎯 Daily Mission: {latestCheckin.primaryMission}</h3>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground">No check-in found for today.</p>
                        <Button asChild variant="link"><Link href="/daily-plan">Check in now to set your mission!</Link></Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                 <Button asChild variant="outline" size="lg"><Link href="/forms/activity"><Camera className="mr-2 h-4 w-4"/>Log Activity</Link></Button>
                 <Button asChild variant="outline" size="lg"><Link href="/forms/expense"><Receipt className="mr-2 h-4 w-4"/>Add Expense</Link></Button>
            </CardContent>
        </Card>
    )
}

interface DashboardProps {
  profile: User;
}

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-1">
        <TodaysBattlePlan />
        <DailyActions />
        <MyPriorities />
        <SmartReminders profile={profile} />
        <TeamPulse checkouts={checkouts} />
    </DashboardGrid>
  )
}
