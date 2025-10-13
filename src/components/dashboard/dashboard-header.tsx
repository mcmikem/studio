
"use client"

import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "../ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";


export function DashboardHeader({ profile }: { profile: User }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');

  return (
    <Card className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-center min-h-[150px]">
        {headerImage && (
            <>
                <Image
                    src={headerImage.imageUrl}
                    alt="Header background"
                    fill
                    className="object-cover"
                    data-ai-hint={headerImage.imageHint}
                />
                <div className="absolute inset-0 bg-teal-800/80 mix-blend-multiply" />
            </>
        )}
       <div className="relative z-10 text-white">
          <p className="text-md text-white/80">Good Morning!</p>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
              {profile?.name.split(' ')[0] || "User"}!
          </h1>
      </div>
    </Card>
  )
}
