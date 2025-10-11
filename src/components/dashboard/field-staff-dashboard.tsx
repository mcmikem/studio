
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamPulse } from "./team-activity-feed"
import { MyPriorities } from "./my-priorities"
import { TeamToday } from "./team-today"
import { DashboardGrid } from "./dashboard-grid"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit, where } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"
import { Button } from "../ui/button"
import { Camera, MapPin, Plus, Receipt, FileText, Target, Milestone, Trees, Users, HandCoins, FlaskConical, Lightbulb, UserPlus, Map, Loader2 } from "lucide-react"
import Link from "next/link"
import { generateSmartReminders } from "@/ai/flows/smart-reminders-flow"
import React, { useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"

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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1"><MapPin className="h-4 w-4"/> In the Field</div>
                            <div className="flex items-center gap-1"><Milestone className="h-4 w-4"/> All Day</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground">No check-in found for today.</p>
                        <Button asChild variant="link"><Link href="/forms?tab=check-in">Check in now to set your mission!</Link></Button>
                    </div>
                )}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Mission Progress</span>
                        <span className="text-sm font-medium">50% (Example)</span>
                    </div>
                    <Progress value={50} />
                    <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold text-primary">NEXT:</span> Follow up with St. Mary's School.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function FieldIntelligence() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Field Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h4 className="font-semibold text-md mb-2">📊 October Plan Impact</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2"><Trees className="h-4 w-4 text-green-500" /> Trees: <span className="font-bold">458/510 (89%)</span></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-red-500" /> Parents: <span className="font-bold">185/200 (92%)</span></div>
                        <div className="flex items-center gap-2"><HandCoins className="h-4 w-4 text-yellow-500" /> Funds: <span className="font-bold">675K/1.5M (45%)</span></div>
                        <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-blue-500" /> Pads: <span className="font-bold">5/10 (50%)</span></div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-md mb-2">📍 Nearby Opportunities</h4>
                     <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md"><Map className="h-4 w-4 text-primary" />St. Mary's School (2km) - needs RED Campaign</div>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md"><UserPlus className="h-4 w-4 text-primary" />3 Volunteers available in your area</div>
                    </div>
                </div>
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
                 <Button asChild variant="outline" size="lg"><Link href="/forms?tab=activity"><Camera className="mr-2 h-4 w-4"/>Log Activity</Link></Button>
                 <Button variant="outline" size="lg" disabled><UserPlus className="mr-2 h-4 w-4"/>Add Volunteer</Button>
                 <Button asChild variant="outline" size="lg"><Link href="/forms?tab=expense"><Receipt className="mr-2 h-4 w-4"/>Add Expense</Link></Button>
                 <Button variant="outline" size="lg" disabled><FileText className="mr-2 h-4 w-4"/>Field Report</Button>
            </CardContent>
        </Card>
    )
}

function SmartReminders({ profile }: { profile: User }) {
    const [reminders, setReminders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReminders() {
            if (!profile) return;
            setIsLoading(true);
            try {
                const response = await generateSmartReminders({
                    userId: profile.id,
                    userName: profile.name,
                    userRole: profile.role,
                });
                setReminders(response.reminders);
            } catch (error) {
                console.error("Failed to generate smart reminders:", error);
                setReminders(["Could not load AI reminders at this time."]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReminders();
    }, [profile]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Smart Reminders</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : (
                    <ul className="space-y-3 list-disc list-inside text-sm">
                        {reminders.map((reminder, index) => (
                            <li key={index}>{reminder}</li>
                        ))}
                    </ul>
                )}
                 {isLoading && (
                    <div className="flex items-center justify-center pt-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="ml-2 text-sm text-muted-foreground">AI is thinking...</p>
                    </div>
                )}
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
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

      <DashboardGrid className="lg:grid-cols-1">
        <TodaysBattlePlan />
        <FieldIntelligence />
        <QuickActions />
        <SmartReminders profile={profile} />
        <TeamPulse checkouts={checkouts} />
      </DashboardGrid>
    </div>
  )
}
