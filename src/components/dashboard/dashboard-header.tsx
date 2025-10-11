
"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { Calendar, CheckCircle, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className="h-5 w-5 text-primary" />
        <div>
            <p className="font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    </div>
);

export function DashboardHeader({ profile }: { profile: User }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
                {profile?.name || "User"}
                </h1>
                <p className="text-muted-foreground">{profile?.role || "Staff Member"}</p>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(currentTime, "eeee, MMMM d, yyyy")}</span>
            </div>
        </div>
        <div className="border-b -mx-6 my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem icon={CheckCircle} label="Tasks Today" value="--" />
            <StatItem icon={Target} label="October Plan Points" value="--" />
            <StatItem icon={Users} label="People Impacted" value="--" />
        </div>
    </div>
  )
}
