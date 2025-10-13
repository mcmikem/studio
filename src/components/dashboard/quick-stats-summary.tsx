
"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees } from "lucide-react"
import { useMemo } from "react"
import { formatCurrency } from "@/lib/utils"

const metricIcons: { [key: string]: React.ElementType } = {
  "Cycle of Dignity Fundraising": HandCoins,
  "Girls Supported (RED)": Users,
  "Schools Supported": Target,
  "Trees Planted (GreenSchools)": Trees,
  default: Target,
}


export function QuickStatsSummary({ metrics }: { metrics: ImpactMetric[] | null }) {

  const displayMetrics = useMemo(() => {
    if (!metrics) return Array(4).fill(null);
    // Prioritize specific metrics from the design
    const priorityOrder = ["Girls Supported (RED)", "Cycle of Dignity Fundraising", "Schools Supported", "Trees Planted (GreenSchools)"];
    const sortedMetrics = [...metrics].sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.metric);
        const bIndex = priorityOrder.indexOf(b.metric);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });
    return sortedMetrics.slice(0, 4);
  }, [metrics])

  if (metrics && metrics.length === 0) {
    return (
       <Card className="col-span-full">
        <CardContent className="p-6 text-center text-muted-foreground">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
        <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayMetrics.map((metric, i) => {
                if (!metric) {
                return (
                    <Card key={i} className="p-4 flex flex-col justify-between h-32 bg-background">
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
                <Link href="/management/metrics" key={metric.id} className="block">
                    <Card className="p-4 flex flex-col justify-between h-32 hover:bg-muted transition-colors shadow-none border-0 bg-background">
                        <div className="flex justify-between items-start text-muted-foreground">
                        <p className="text-sm font-semibold">{metric.metric.split('(')[0]}</p>
                        <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="mt-auto">
                        <div className="text-2xl font-bold text-foreground">
                            {formatValue(metric.current)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Target: {metric.target.toLocaleString()}
                        </p>
                        </div>
                    </Card>
                </Link>
                )
            })}
            </div>
        </CardContent>
    </Card>
  )
}
