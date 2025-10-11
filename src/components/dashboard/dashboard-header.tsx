
"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { Calendar, CheckCircle, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";


export function DashboardHeader({ profile }: { profile: User }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header')?.imageUrl;


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 p-6 md:p-8 h-40 flex flex-col justify-end bg-card">
        {headerImage && (
             <Image
                src={headerImage}
                alt="Dashboard header background"
                layout="fill"
                objectFit="cover"
                className="opacity-20"
                data-ai-hint="background image"
            />
        )}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {profile?.name.split(' ')[0] || "User"}!
                </h1>
                <p className="text-muted-foreground">{profile?.role || "Staff Member"}</p>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                <span>{format(currentTime, "eeee, MMMM d, yyyy")}</span>
            </div>
        </div>
    </div>
  )
}
