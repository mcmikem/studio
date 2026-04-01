
"use client"

import type { User } from "@/lib/types"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ShieldCheck, Zap } from 'lucide-react'
import { SyncBadge } from '@/components/offline/offline-indicator'
 
export function DashboardHeader({ profile, title }: { profile: User, title?: string }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setCurrentDate(format(new Date(), 'EEEE, do MMMM'));
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);
 
  const isED = profile?.role === 'Executive Director';
  const isField = profile?.role?.toLowerCase().includes('field');

  return (
      <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                {currentDate || title}
              </p>
              <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-omuto-navy">
                {greeting}, <span className="text-primary">{profile?.name?.split(' ')[0] || "User"}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <SyncBadge />
              <div className="flex items-center gap-1.5 bg-omuto-navy/5 px-2.5 py-1 rounded-full text-xs font-medium text-omuto-navy/70">
                {isED ? <ShieldCheck className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                <span className="hidden sm:inline">{profile?.role}</span>
                <span className="sm:hidden">{profile?.role?.split(' ')[0]}</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground hidden sm:block">
            Tap <span className="font-bold text-primary">+</span> to quickly log activities, expenses, and more.
          </p>
      </div>
  )
}
