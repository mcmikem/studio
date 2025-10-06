"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees } from "lucide-react"
import { useMemo } from "react"

// Define which metrics to feature on the dashboard
const FEATURED_METRICS = [
  "Cycle of Dignity Fundraising",
  "Girls Supported (RED)",
  "Youth Reached",
  "Trees Planted (GreenSchools)",
]

const metricIcons: { [key: string]: React.ElementType } = {
  "Cycle of Dignity Fundraising": HandCoins,
  "Girls Supported (RED)": Users,
  "Youth Reached": Users,
  "Trees Planted (GreenSchools)": Trees,
  default: Target,
}

export function QuickStatsSummary() {
  const firestore = useFirestore()
  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    // Fetch only the featured metrics
    return query(
      collection(firestore, "impact-metrics"),
      where("metric", "in", FEATURED_METRICS),
      orderBy("metric")
    )
  }, [firestore])

  const { data: metrics, isLoading } = useCollection<ImpactMetric>(metricsQuery)

  // Ensure consistent order
  const displayMetrics = useMemo(() => {
    if (!metrics) return []
    return FEATURED_METRICS.map(
      (fm) =>
        metrics.find((m) => m.metric === fm) || {
          id: fm,
          metric: fm,
          current: 0,
          target: 0,
          isPlaceholder: true,
        }
    )
  }, [metrics])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {(isLoading ? Array(4).fill(0) : displayMetrics).map((metric, i) => {
        if (isLoading || !metric) {
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
          )
        }

        const Icon = metricIcons[metric.metric] || metricIcons.default
        const formatValue = (val: number) =>
          metric.unit === "UGX"
            ? new Intl.NumberFormat("en-UG", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              }).format(val)
            : `${val.toLocaleString()} ${metric.unit || ""}`.trim()

        return (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(metric.current)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: {formatValue(metric.target)}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
