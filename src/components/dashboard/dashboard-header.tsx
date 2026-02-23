
"use client"

import type { User } from "@/lib/types"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'
 
export function DashboardHeader({ profile, title }: { profile: User, title?: string }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'EEEE, do MMMM'));
  }, []);
 
  return (
      <div className="relative border-md border-omuto-navy/20 rounded-2xl shadow-comic overflow-hidden p-8 md:p-10 flex flex-col justify-end min-h-[180px] bg-white transition-all group">
          {headerImage && (
              <>
                  <Image
                      src={headerImage.imageUrl}
                      alt="Omuto Impact"
                      fill
                      className="object-cover opacity-10 grayscale-[50%] transition-all duration-1000 group-hover:opacity-15 group-hover:grayscale-0"
                      priority
                  />
              </>
          )}
        <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-omuto-navy/60 font-bold uppercase text-[9px] tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-omuto-red animate-pulse" />
                {currentDate || title || `HQ STATUS: ACTIVE`}
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-omuto-navy leading-none mt-2">
                Hello, <span className="text-primary">{profile?.name.split(' ')[0] || "User"}.</span>
            </h1>
            <div className="flex items-center gap-3 mt-4">
                 <span className="bg-omuto-navy text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-comic-sm">
                    {profile?.role}
                </span>
                <div className="p-1.5 bg-omuto-yellow border-md border-omuto-navy rounded-lg shadow-comic-sm rotate-2">
                    <Sparkles className="h-4 w-4 text-omuto-navy" />
                </div>
            </div>
        </div>
      </div>
  )
}
