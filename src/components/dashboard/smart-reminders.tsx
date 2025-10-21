
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
    const [status, setStatus] = useState<'loading' | 'retrying' | 'success' | 'error'>('loading');
    const firestore = useFirestore();

    const fetchAndGenerateReminders = useCallback(async () => {
        if (!profile || !firestore) {
            setStatus('error');
            setReminders(["Could not load user profile or database."]);
            return;
        }

        setStatus('loading');

        for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
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
                setStatus('success');
                return; // Success, exit the loop

            } catch (error: any) {
                console.error(`Attempt ${attempt} failed to generate smart reminders:`, error);
                
                if (error.message?.includes('503') && attempt <= MAX_RETRIES) {
                    setStatus('retrying');
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    // Continue to the next iteration of the loop
                } else {
                    setStatus('error');
                    if (error.message?.includes('503')) {
                        setReminders(["The AI assistant is currently unavailable. Please try again later."]);
                    } else {
                        setReminders(["Could not load AI reminders at this time."]);
                    }
                    return; // Failure, exit the loop
                }
            }
        }
    }, [profile, firestore]);

    useEffect(() => {
        fetchAndGenerateReminders();
    }, [fetchAndGenerateReminders]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <p className="ml-2 text-sm text-muted-foreground">AI is thinking...</p>
                        </div>
                    </>
                );
            case 'retrying':
                return (
                    <>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex items-center justify-center pt-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <p className="ml-2 text-sm text-muted-foreground">AI is busy, retrying...</p>
                        </div>
                    </>
                );
            case 'success':
                return (
                    <ul className="space-y-3 list-disc list-inside text-sm">
                        {reminders.map((reminder, index) => (
                            <li key={index}>{reminder}</li>
                        ))}
                    </ul>
                );
            case 'error':
                 return (
                    <ul className="space-y-3 list-disc list-inside text-sm text-destructive">
                        {reminders.map((reminder, index) => (
                            <li key={index}>{reminder}</li>
                        ))}
                    </ul>
                );
            default:
                return null;
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Smart Reminders</CardTitle>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    )
}
