
"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";


export function DashboardHeader({ profile }: { profile: User }) {
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
    <Card className="relative rounded-2xl overflow-hidden p-6 bg-secondary text-secondary-foreground flex flex-col justify-center">
       <div className="relative z-10 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-primary ring-4 ring-primary/20">
              {profile?.photoURL && <AvatarImage src={profile.photoURL} alt={profile.name} />}
              <AvatarFallback className="text-2xl font-bold bg-secondary text-primary">
                  {getInitials(profile?.name)}
              </AvatarFallback>
          </Avatar>
          <div>
              <p className="text-md text-secondary-foreground/80">Good Morning!</p>
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                  {profile?.name.split(' ')[0] || "User"}!
              </h1>
          </div>
      </div>
    </Card>
  )
}
