"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RecentCheckouts } from "./recent-checkouts"

export function TeamActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle size="xl">Team Pulse</CardTitle>
        <CardDescription>
          Live activity and updates from the team check-outs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecentCheckouts />
      </CardContent>
    </Card>
  )
}
