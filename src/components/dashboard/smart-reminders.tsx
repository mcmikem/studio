
"use client"

import React, { useEffect, useState } from "react"
import { generateSmartReminders } from "@/ai/flows/smart-reminders-flow"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { Lightbulb, Loader2 } from "lucide-react"
import type { User } from "@/lib/types"

export function SmartReminders({ profile }: { profile: User }) {
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
