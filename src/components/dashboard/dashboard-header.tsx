
"use client"

import { useMemo } from "react";
import type { User, Checkin } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "../ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { TodaysFocus } from "./todays-focus";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";


export function DashboardHeader({ profile, title }: { profile: User, title?: string }) {
  const headerImage = PlaceHolderImages.find(p => p.id === 'dashboard-header');
  const firestore = useFirestore();
  const { user } = useUser();

  const latestCheckinQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', todayTimestamp)
    );
  }, [user, firestore]);

  const { data: checkins, isLoading: isLoadingCheckin } = useCollection<Checkin>(latestCheckinQuery);

  // Since we removed orderBy, we sort on the client.
  const latestCheckin = useMemo(() => {
    if (!checkins || checkins.length === 0) return null;
    return checkins.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  }, [checkins]);

  return (
    <>
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
            <p className="text-md text-white/80">{title || `Good Morning!`}</p>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
                {profile?.name.split(' ')[0] || "User"}!
            </h1>
        </div>
      </Card>
      {latestCheckin && <TodaysFocus checkin={latestCheckin} isLoading={isLoadingCheckin} />}
    </>
  )
}
