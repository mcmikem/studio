"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'UGX',
        currencyDisplay: 'code',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value).replace('UGX', 'USH');
};


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
             <Card key={i} className="p-4 flex flex-col justify-between h-32">
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
            ? formatCurrency(val)
            : `${val.toLocaleString()}`
        
        return (
          <Link href="/management/metrics" key={metric.id}>
            <Card className="p-4 flex flex-col h-32 hover:bg-muted/50 transition-colors shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-muted-foreground">{metric.metric.split('(')[0]}</p>
                   <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-auto">
                   <div className="text-3xl font-bold">
                      {formatValue(metric.current)}
                  </div>
                 {!metric.isPlaceholder && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Target: {metric.target.toLocaleString()}
                    </p>
                 )}
                </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
