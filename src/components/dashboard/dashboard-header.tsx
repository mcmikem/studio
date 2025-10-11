"use client"

import type { User } from "@/lib/types"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function DashboardHeader({ profile }: { profile: User }) {
  const headerImage = PlaceHolderImages.find(p => p.id === "dashboard-header")

  return (
    <div className="relative rounded-xl overflow-hidden h-40 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6">
      {headerImage && (
        <Image
          src={headerImage.imageUrl}
          alt={headerImage.description}
          fill
          className="object-cover"
          data-ai-hint={headerImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30" />
      <div className="absolute bottom-0 left-0 p-6">
        <p className="text-lg text-white/90">{getGreeting()}</p>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
          {profile?.name || "User"}
        </h1>
      </div>
    </div>
  )
}
