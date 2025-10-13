
"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "../ui/card";


export function DashboardHeader({ profile }: { profile: User }) {

  return (
    <Card className="relative rounded-2xl overflow-hidden p-6 bg-secondary text-secondary-foreground flex flex-col justify-center">
       <div className="relative z-10">
          <p className="text-md text-secondary-foreground/80">Good Morning!</p>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
              {profile?.name.split(' ')[0] || "User"}!
          </h1>
      </div>
    </Card>
  )
}
