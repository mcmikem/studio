"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees } from "lucide-react"
import { useMemo } from "react"
import { Progress } from "../ui/progress"

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

export function QuickStatsSummary({ metrics }: { metrics: ImpactMetric[] | null }) {

  const displayMetrics = useMemo(() => {
    if (!metrics) return Array(FEATURED_METRICS.length).fill(null);
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {displayMetrics.map((metric, i) => {
        if (!metric) {
          return (
             <Card key={i} className="p-4 flex flex-col justify-between">
              <Skeleton className="h-6 w-6 mb-4" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
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
                maximumFractionDigits: 0,
              }).format(val)
            : `${val.toLocaleString()}`
        
        const progress = metric.target > 0 ? (metric.current / metric.target) * 100 : 0;
        const targetValueDisplay = metric.unit === 'UGX' ? `${(metric.target/1000000).toFixed(1)}M` : metric.target.toLocaleString();

        return (
          <Card key={metric.id} className="p-4 flex flex-col">
              <div className="flex justify-between items-start">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="mt-auto space-y-2 pt-4">
                <p className="text-sm font-medium text-muted-foreground">{metric.metric.split('(')[0]}</p>
                <div className="text-2xl font-bold">
                    {formatValue(metric.current)}
                </div>
                 {!metric.isPlaceholder && (
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1 flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                )}
                 <p className="text-xs text-muted-foreground">Target: {targetValueDisplay}</p>
              </div>
          </Card>
        )
      })}
    </div>
  )
}
