
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "../ui/skeleton"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import type { ImpactMetric } from "@/lib/types"
import { Target } from "lucide-react"
import Link from "next/link"

export function ImpactOverview() {
  const firestore = useFirestore()
  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "impact-metrics"), orderBy("metric"))
  }, [firestore])

  const { data: metrics, isLoading } = useCollection<ImpactMetric>(metricsQuery)
  const displayMetrics = metrics?.slice(0, 4)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Overview</CardTitle>
        <CardDescription>
          A real-time look at our key performance indicators.{" "}
          <Link
            href="/management/metrics"
            className="text-primary hover:underline"
          >
            Manage Metrics
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          ))}
        {displayMetrics && displayMetrics.length > 0 ? (
          displayMetrics.map((metric) => {
            const progress =
              metric.target > 0 ? (metric.current / metric.target) * 100 : 0
            const formatValue = (val: number) =>
              metric.unit === "UGX"
                ? new Intl.NumberFormat("en-UG", {
                    style: "currency",
                    currency: "UGX",
                    minimumFractionDigits: 0,
                  }).format(val)
                : `${val.toLocaleString()} ${metric.unit || ""}`.trim()

            return (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{metric.metric}</span>
                  <span className="text-xs text-muted-foreground">
                    {((progress * 100) / 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{formatValue(metric.current)}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {formatValue(metric.target)}
                </p>
                <Progress value={progress} className="mt-2 h-2" />
              </div>
            )
          })
        ) : (
          !isLoading && (
            <div className="md:col-span-4 text-center text-muted-foreground py-8 flex flex-col items-center justify-center">
              <Target className="h-10 w-10 mb-2" />
              <p className="font-semibold">No Impact Metrics Found</p>
              <p className="text-sm">
                Go to{" "}
                <Link
                  href="/management/metrics"
                  className="text-primary hover:underline"
                >
                  Metrics Management
                </Link>{" "}
                to add your first KPI.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
