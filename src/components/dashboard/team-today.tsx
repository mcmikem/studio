
"use client"

import { useState, useEffect } from "react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import {
  collection,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore"
import type { Checkin } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import type { User as UserProfile } from "@/lib/types"

const getStatusColor = (status: string) => {
  if (status === "Not Checked In") {
    return "bg-gray-400"
  }
  return "bg-green-500"
}

export function TeamToday() {
  const firestore = useFirestore()
  const [startOfDay, setStartOfDay] = useState<Timestamp | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setStartOfDay(Timestamp.fromDate(now));
  }, []);


  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore || !startOfDay) return null;
    return query(
      collection(firestore, "checkins"),
      where("timestamp", ">=", startOfDay)
    )
  }, [startOfDay])

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "users"), orderBy("name"))
  }, [])

  const { data: checkins, isLoading: isLoadingCheckins } =
    useCollection<Checkin>(checkinsQuery)
  const { data: allTeamMembers, isLoading: isLoadingUsers } =
    useCollection<UserProfile>(usersQuery)

  const teamStatus = useMemoFirebase(() => {
    const isLoading = isLoadingUsers || isLoadingCheckins;
    if (isLoading || !allTeamMembers)
      return Array.from({ length: 5 }).map((_, i) => ({
        id: `${i}`,
        name: "Loading...",
        status: "Loading",
      }))

    const checkedInUsersMap = new Map(
      checkins?.map((c) => [c.userId, c.primaryMission])
    )

    return allTeamMembers.map((member) => {
      const mission = checkedInUsersMap.get(member.id)
      return {
        id: member.id,
        name: member.name,
        status: mission || "Not Checked In",
      }
    })
  }, [checkins, isLoadingCheckins, allTeamMembers, isLoadingUsers])

  const isLoading = isLoadingUsers || isLoadingCheckins || !startOfDay;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Today
        </CardTitle>
        <CardDescription>Who's checked in and on what mission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-3 w-3 rounded-full mt-1" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))
          : teamStatus.map((member) => (
              <div key={member.id} className="flex items-start gap-3">
                <span
                  className={`flex h-3 w-3 flex-shrink-0 rounded-full ${getStatusColor(
                    member.status
                  )} mt-1`}
                ></span>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-muted-foreground">{member.status}</p>
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  )
}
