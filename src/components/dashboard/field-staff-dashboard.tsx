
"use client"

import type { User, Checkout } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamPulse } from "./team-activity-feed"
import { MyPriorities } from "./my-priorities"
import { TeamToday } from "./team-today"
import { DashboardGrid } from "./dashboard-grid"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"
import { Button } from "../ui/button"
import { Camera, MapPin, Plus, Receipt, FileText, Target, Milestone, Trees, Users, HandCoins, FlaskConical, Lightbulb, UserPlus, Map } from "lucide-react"

function TodaysBattlePlan() {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="text-primary"/>
                    Today's Battle Plan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold">🎯 Daily Mission: Plant 50 trees at Kibibi SS</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1"><MapPin className="h-4 w-4"/> Kibibi Primary School</div>
                        <div className="flex items-center gap-1"><Milestone className="h-4 w-4"/> 8:30 AM - 3:00 PM</div>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">50/50 trees</span>
                    </div>
                    <Progress value={100} />
                    <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold text-primary">NEXT:</span> Train Green Team @ 2:00 PM
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
                 <Button variant="outline" size="lg"><Camera className="mr-2 h-4 w-4"/>Log Planting</Button>
                 <Button variant="outline" size="lg"><UserPlus className="mr-2 h-4 w-4"/>Add Volunteer</Button>
                 <Button variant="outline" size="lg"><Receipt className="mr-2 h-4 w-4"/>Add Expense</Button>
                 <Button variant="outline" size="lg"><FileText className="mr-2 h-4 w-4"/>Field Report</Button>
            </CardContent>
        </Card>
    )
}

function SmartReminders() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Smart Reminders</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 list-disc list-inside text-sm">
                    <li><span className="font-semibold text-primary">Tip:</span> Take before/after photos of the tree planting site for the report.</li>
                    <li><span className="font-semibold text-primary">Follow-up:</span> Check seedling survival rate from last visit to Ggangu.</li>
                    <li><span className="font-semibold text-primary">Recruit:</span> Identify 2 promising student leaders for the Student Leaders Forum program.</li>
                </ul>
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
        <SmartReminders />
        <TeamPulse checkouts={checkouts} />
      </DashboardGrid>
    </div>
  )
}
