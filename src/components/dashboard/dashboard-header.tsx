
"use client"

import type { User } from "@/lib/types"
import { Card } from "../ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
 
export function DashboardHeader({ profile, title }: { profile: User, title?: string }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // This effect runs only on the client, avoiding hydration mismatch.
    setCurrentDate(format(new Date(), 'eeee, MMMM d, yyyy'));
  }, []);
 
  return (
      <Card className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-center min-h-[150px] bg-card text-card-foreground">
          {headerImage && (
              <>
                  <Image
                      src={headerImage.imageUrl}
                      alt="Header background"
                      fill
                      className="object-cover"
                      data-ai-hint={headerImage.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
              </>
          )}
        <div className="relative z-10 text-white">
            <p className="text-md text-white/80">{currentDate || title || `Good Morning!`}</p>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
                Welcome, {profile?.name.split(' ')[0] || "User"}!
            </h1>
        </div>
      </Card>
  )
}
