
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees, Plus } from "lucide-react"
import { useMemo } from "react"
import { formatCurrency } from "@/lib/utils"

const metricIcons: { [key: string]: React.ElementType } = {
  "Girls Supported (RED)": Users,
  "Cycle of Dignity Fundraising": HandCoins,
  "Schools Supported": Target,
  "Trees Planted (GreenSchools)": Trees,
  default: Target,
}

import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"

export function QuickStatsSummary() {
  const firestore = useFirestore();
  const metricsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'impact-metrics'), orderBy('metric'), limit(50));
  }, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);

  const displayMetrics = useMemo(() => {
    if (!metrics) return null;
    const priorityOrder = ["Girls Supported (RED)", "Cycle of Dignity Fundraising", "Schools Supported", "Trees Planted (GreenSchools)"];
    return [...metrics]
        .sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a.metric);
            const bIndex = priorityOrder.indexOf(b.metric);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        })
        .slice(0, 4);
  }, [metrics]);

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 70) return 'text-green-600';
    if (progress >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (metrics === null) {
     return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl border-lg" />
            ))}
        </div>
     )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {displayMetrics?.map((metric) => {
        const Icon = metricIcons[metric.metric] || metricIcons.default
        const progress = Math.min(100, Math.round((metric.current / metric.target) * 100));
        
        return (
        <Link href="/management/metrics" key={metric.id} className="group">
            <Card className="card-comic-clean h-36">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full ${progress >= 70 ? 'bg-green-500 animate-pulse' : progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.unit || 'UNITS'}</span>
                    </div>
                    
                    <div className="mt-auto space-y-3">
                        <div>
                            <p className="font-heading font-black uppercase text-xs tracking-tight text-omuto-navy/70 leading-none mb-1">{metric.metric.split('(')[0]}</p>
                            <h3 className="font-heading text-3xl font-black tracking-tight text-omuto-navy leading-none">
                                {metric.unit === "UGX" ? formatCurrency(metric.current, true) : metric.current.toLocaleString()}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden border border-omuto-navy/10">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(progress)}`} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className={`text-[10px] font-black ${getProgressTextColor(progress)}`}>{progress}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
        )
    })}
    </div>
  )
}
