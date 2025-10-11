
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickInsights() {
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
