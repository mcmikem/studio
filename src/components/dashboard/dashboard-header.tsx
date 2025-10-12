"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { Calendar, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


export function DashboardHeader({ profile }: { profile: User }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header-dark-leaves');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
      }
      return name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 h-48 flex flex-col justify-end text-white shadow-lg">
       {headerImage && (
         <Image
            src={headerImage.imageUrl}
            alt={headerImage.description}
            data-ai-hint={headerImage.imageHint}
            fill
            className="object-cover"
            priority
        />
       )}
       <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
                 <Avatar className="h-16 w-16 border-2 border-primary">
                    {profile?.photoURL && <AvatarImage src={profile.photoURL} alt={profile.name} />}
                    <AvatarFallback className="text-xl bg-background/20">{getInitials(profile?.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-white/80">Good Morning!</p>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                    {profile?.name.split(' ')[0] || "User"}!
                    </h1>
                </div>
            </div>
             <div className="hidden md:flex items-center justify-end gap-6 text-right">
                <div>
                    <p className="font-headline text-5xl font-bold tracking-tighter">{format(currentTime, "HH:mm")}</p>
                    <p className="text-sm font-medium flex items-center justify-end gap-2 text-white/80">
                        <Calendar className="h-4 w-4" />
                        <span>{format(currentTime, "eeee, MMMM d")}</span>
                    </p>
                </div>
                 <div className="text-center text-white/80">
                    <Sun className="h-12 w-12 text-yellow-400" />
                    <p className="font-bold text-lg">24°C</p>
                </div>
            </div>
        </div>
    </div>
  )
}
