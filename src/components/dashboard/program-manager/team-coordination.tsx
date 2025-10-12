
'use client';

import { useMemo } from 'react';
import type { User, Checkin, Expense } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { startOfDay } from 'date-fns';
import { CheckCircle, UserX, Users } from 'lucide-react';
import Link from 'next/link';


export function TeamCoordination({ users, checkins, expenses }: { users: User[] | null, checkins: Checkin[] | null, expenses: Expense[] | null }) {
    const teamStatus = useMemo(() => {
        if (!users) return [];
        
        return users.map(user => {
            const userCheckin = checkins?.find(c => c.userId === user.id);
            if (userCheckin) {
                return { name: user.name, task: userCheckin.primaryMission, status: 'on-track' };
            }
            return { name: user.name, task: 'Not checked in today', status: 'off-track' };
        });
    }, [users, checkins]);

    const resourceAlerts = useMemo(() => {
        if (!expenses) return { transportBudgetUsed: 0 };
        const monthlyBudget = 800000; // Mock budget
        const transportExpenses = expenses
            .filter(e => e.status === 'Approved' || e.status === 'Cleared')
            .flatMap(e => e.items)
            .filter(item => item.category === 'Transport')
            .reduce((sum, item) => sum + item.amount, 0);
        
        return {
            transportBudgetUsed: (transportExpenses / monthlyBudget) * 100
        }

    }, [expenses]);


    const statusIcons = {
        'on-track': <CheckCircle className="h-4 w-4 text-green-500" />,
        'off-track': <UserX className="h-4 w-4 text-red-500" />
    };

    return (
        <Card className="hover:bg-muted/50 transition-colors">
            <Link href="/checkins">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Team Coordination</CardTitle>
                    <CardDescription>Live status of team deployment and resources.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Team Deployment</h4>
                        <div className="space-y-3">
                            {!users || !checkins ? (
                                Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
                            ) : (
                                 teamStatus.map(member => (
                                    <div key={member.name} className="flex items-center gap-2">
                                        {statusIcons[member.status as keyof typeof statusIcons]}
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-muted-foreground truncate">- {member.task}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold">Resource Alerts</h4>
                        {!expenses ? <Skeleton className="h-10 w-full" /> : (
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <p>• Transport budget: <span className="font-bold">{resourceAlerts.transportBudgetUsed.toFixed(0)}% used</span> (Sample)</p>
                                <p>• Volunteer gap: <span className="font-bold text-red-500">Need 0 more</span> (Sample)</p>
                            </div>
                        )}
                     </div>
                </CardContent>
            </Link>
        </Card>
    )
}
