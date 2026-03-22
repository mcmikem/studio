
"use client"

import type { User } from "@/lib/types"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Sparkles, Plus, ClipboardCheck, Calendar, TrendingUp, Zap, ShieldCheck, Heart } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
 
export function DashboardHeader({ profile, title }: { profile: User, title?: string }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'EEEE, do MMMM'));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
 
  // Role-specific flair
  const isED = profile?.role === 'Executive Director';
  const isField = profile?.role?.toLowerCase().includes('field');

  return (
      <div className="relative border-lg border-omuto-navy/10 rounded-[2rem] shadow-comic-sm overflow-hidden p-8 md:p-12 flex flex-col justify-end min-h-[220px] bg-white transition-all group">
          {headerImage && (
              <div className="absolute inset-0 z-0">
                  <Image
                      src={headerImage.imageUrl}
                      alt="Omuto Impact"
                      fill
                      className="object-cover opacity-[0.03] grayscale transition-all duration-1000 group-hover:opacity-[0.07] group-hover:scale-105"
                      priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
              </div>
          )}
          
        <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center gap-3 text-omuto-navy/40 font-black uppercase text-[10px] tracking-[0.2em] mb-2">
                <div className="flex h-2 w-2 relative">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-omuto-red opacity-75"></div>
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-omuto-red"></div>
                </div>
                {currentDate || title || `SYSTEM STATUS: OPTIMAL`}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tighter text-omuto-navy leading-none">
                        {greeting}, <span className="text-primary italic">{profile?.name.split(' ')[0] || "User"}.</span>
                    </h1>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1.5 bg-omuto-navy text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                            {isED ? <ShieldCheck className="h-3 w-3 text-omuto-yellow" /> : <Zap className="h-3 w-3 text-omuto-yellow" />}
                            {profile?.role}
                         </div>
                         <div className="h-1 w-1 rounded-full bg-omuto-navy/20" />
                         <span className="text-[10px] font-bold text-omuto-navy/50 uppercase tracking-widest">Studio Workspace</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isField ? (
                        <>
                            <Button asChild size="sm" className="btn-omuto h-10 rounded-xl px-5 text-[11px] font-black uppercase tracking-wider shadow-comic-sm hover:-translate-y-1 transition-transform">
                                <Link href="/school-xperience/log-visit">
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Log School Visit
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-10 rounded-xl px-5 text-[11px] font-black uppercase tracking-wider border-2 border-omuto-navy/10 bg-white shadow-sm hover:border-omuto-navy/30 transition-all">
                                <Link href="/meal/activity">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Activity Report
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild size="sm" className="btn-omuto h-10 rounded-xl px-5 text-[11px] font-black uppercase tracking-wider shadow-comic-sm hover:-translate-y-1 transition-transform">
                                <Link href="/meal/activity">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Quick Report
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-10 rounded-xl px-4 text-[11px] font-black uppercase tracking-wider border-2 border-omuto-navy/10 bg-white shadow-sm hover:border-omuto-navy/30">
                                <Link href="/meal/beneficiary-registration">
                                    <Heart className="h-4 w-4 mr-2 text-omuto-red" />
                                    Register Impact
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
  )
}
