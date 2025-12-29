
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees } from "lucide-react"
import { useMemo } from "react"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "../ui/empty-state"

const metricIcons: { [key: string]: React.ElementType } = {
  "Girls Supported (RED)": Users,
  "Cycle of Dignity Fundraising": HandCoins,
  "Schools Supported": Target,
  "Trees Planted (GreenSchools)": Trees,
  default: Target,
}


export function QuickStatsSummary({ metrics }: { metrics: ImpactMetric[] | null }) {

  const displayMetrics = useMemo(() => {
    if (!metrics) return null;
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

  if (metrics === null) {
     return (
       <Card>
        <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(null).map((_, i) => (
                 <Card key={i} className="p-4 flex flex-col justify-between h-32 bg-background border-0 shadow-none">
                      <div className="flex justify-between items-start text-muted-foreground">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-5" />
                      </div>
                      <div className="mt-auto space-y-2">
                          <Skeleton className="h-6 w-1/2" />
                          <Skeleton className="h-3 w-1/3" />
                      </div>
                    </Card>
              ))}
            </div>
        </CardContent>
      </Card>
     )
  }

  if (metrics && metrics.length === 0) {
    return (
       <Card className="col-span-full">
        <CardContent className="p-0">
             <EmptyState
                icon={Target}
                title="No Impact Metrics Found"
                description="Go to Management > Metrics to add your first KPI."
                className="min-h-0 py-10"
              />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
        <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayMetrics?.map((metric) => {
                const Icon = metricIcons[metric.metric] || metricIcons.default
                const formatValue = (val: number) =>
                  metric.unit === "UGX"
                    ? formatCurrency(val, true) // Use compact formatting
                    : `${val.toLocaleString()}`;
                
                return (
                <Link href="/management/metrics" key={metric.id} className="block">
                    <Card className="p-4 flex flex-col justify-between h-32 hover:bg-muted transition-colors shadow-none border-0 bg-background">
                        <div className="flex justify-between items-start text-muted-foreground">
                        <p className="text-sm font-semibold">{metric.metric.split('(')[0]}</p>
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
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
