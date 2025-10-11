"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RecentCheckouts } from "./recent-checkouts"
import type { Checkout } from "@/lib/types"

export function TeamPulse({ checkouts }: { checkouts: Checkout[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Pulse</CardTitle>
        <CardDescription>
          Live activity and updates from the team check-outs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecentCheckouts checkouts={checkouts} />
      </CardContent>
    </Card>
  )
}
