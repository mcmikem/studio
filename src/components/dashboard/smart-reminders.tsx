
"use client"

import React, { useEffect, useState, useCallback } from "react"
import { generateSmartReminders } from "@/ai/flows/smart-reminders-flow"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { Lightbulb, Loader2 } from "lucide-react"
import type { User } from "@/lib/types"
import { getUpcomingEvents, getPendingTasks } from "./dashboard-tools"
import { useFirestore } from "@/firebase"

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 seconds

export function SmartReminders({ profile }: { profile: User }) {
    const [reminders, setReminders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    const fetchAndGenerateReminders = useCallback(async (retries = MAX_RETRIES) => {
        if (!profile || !firestore) {
            setIsLoading(false);
            return;
        };

        try {
            const [events, tasks] = await Promise.all([
                getUpcomingEvents(firestore),
                getPendingTasks(firestore, profile.id)
            ]);

            const response = await generateSmartReminders({
                userName: profile.name,
                userRole: profile.role,
                upcomingEvents: events,
                pendingTasks: tasks,
            });
            setReminders(response.reminders);
            setIsLoading(false);
        } catch (error: any) {
            console.error("Failed to generate smart reminders:", error);
            
            if (error.message && error.message.includes('503 Service Unavailable') && retries > 0) {
                console.log(`AI service unavailable. Retrying in ${RETRY_DELAY / 1000}s... (${retries} retries left)`);
                setTimeout(() => fetchAndGenerateReminders(retries - 1), RETRY_DELAY);
            } else {
                 if (error.message && error.message.includes('503 Service Unavailable')) {
                    setReminders(["The AI is currently busy. Reminders will be back shortly."]);
                } else {
                    setReminders(["Could not load AI reminders at this time."]);
                }
                setIsLoading(false);
            }
        }
    }, [profile, firestore]);

    useEffect(() => {
        setIsLoading(true);
        fetchAndGenerateReminders();
    }, [fetchAndGenerateReminders]);


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
