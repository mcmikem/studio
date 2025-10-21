
"use client"

import React, { useEffect, useState } from "react"
import { generateSmartReminders } from "@/ai/flows/smart-reminders-flow"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { Lightbulb, Loader2 } from "lucide-react"
import type { User } from "@/lib/types"
import { getUpcomingEvents, getPendingTasks } from "./dashboard-tools"
import { useFirestore } from "@/firebase"

export function SmartReminders({ profile }: { profile: User }) {
    const [reminders, setReminders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        async function fetchAndGenerateReminders() {
            if (!profile || !firestore) return;
            setIsLoading(true);
            try {
                // 1. Fetch data on the client using client-side tools
                const [events, tasks] = await Promise.all([
                    getUpcomingEvents(firestore),
                    getPendingTasks(firestore, profile.id)
                ]);

                // 2. Pass fetched data to the AI flow
                const response = await generateSmartReminders({
                    userName: profile.name,
                    userRole: profile.role,
                    upcomingEvents: events,
                    pendingTasks: tasks,
                });
                setReminders(response.reminders);
            } catch (error: any) {
                console.error("Failed to generate smart reminders:", error);
                // Handle the 503 service unavailable error gracefully
                if (error.message && error.message.includes('503 Service Unavailable')) {
                    setReminders(["The AI is currently busy. Reminders will be back shortly."]);
                } else {
                    setReminders(["Could not load AI reminders at this time."]);
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchAndGenerateReminders();
    }, [profile, firestore]);


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
