"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RecentCheckouts } from "./recent-checkouts"

export function TeamPulse() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Pulse</CardTitle>
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
