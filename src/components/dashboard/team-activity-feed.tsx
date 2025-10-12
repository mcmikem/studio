
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { RecentCheckouts } from "./recent-checkouts"
import type { Checkout } from "@/lib/types"
import Link from "next/link"
import { ArrowRight, Rss } from "lucide-react"
import { Button } from "../ui/button"

export function TeamPulse({ checkouts }: { checkouts: Checkout[] | null }) {
  return (
    <Card className="hover:bg-card/90 transition-colors group/card">
      <Link href="/stream">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rss /> Team Pulse</CardTitle>
          <CardDescription>
            Live activity and updates from the team check-outs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentCheckouts checkouts={checkouts} />
        </CardContent>
        <CardFooter>
            <div className="text-sm text-primary group-hover/card:underline flex items-center justify-end w-full">
                View full stream <ArrowRight className="ml-1 h-4 w-4" />
            </div>
        </CardFooter>
      </Link>
    </Card>
  )
}
