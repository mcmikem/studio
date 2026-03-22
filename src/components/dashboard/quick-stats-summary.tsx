
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import type { ImpactMetric } from "@/lib/types"
import { Target, Users, HandCoins, Trees, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
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
    const priorityOrder = ["Girls Supported (RED)","Cycle of Dignity Fundraising","Schools Supported","Trees Planted (GreenSchools)"];
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
    if (progress >= 70) return 'bg-emerald-500';
    if (progress >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (metrics === null) {
     return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl border-2" />
            ))}
        </div>
     )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {displayMetrics?.map((metric, index) => {
        const Icon = metricIcons[metric.metric] || metricIcons.default
        const progress = Math.min(100, Math.round((metric.current / (metric.target || 1)) * 100));
        
        // Mock trends for visual impact
        const mockTrends = [
            { val: "+12%", up: true },
            { val: "+3.4w", up: true },
            { val: "On Track", up: true },
            { val: "+8%", up: true }
        ];
        const trend = mockTrends[index % mockTrends.length];
        
        return (
        <Link href="/management/metrics" key={metric.id} className="group">
            <Card className="relative overflow-hidden border-2 border-omuto-navy/5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-comic-sm hover:border-omuto-navy/20 transition-all duration-300 h-40 group-hover:-translate-y-1">
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                
                <CardContent className="p-5 h-full flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl ring-4 ring-primary/5 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${trend.up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {trend.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                {trend.val}
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-omuto-navy/20 group-hover:text-primary transition-colors" />
                    </div>
                    
                    <div className="mt-auto space-y-3">
                        <div>
                            <p className="font-heading font-black uppercase text-[10px] tracking-[0.15em] text-omuto-navy/50 leading-none mb-1.5 group-hover:text-omuto-navy transition-colors">{metric.metric.split('(')[0]}</p>
                            <h3 className="font-heading text-3xl font-black tracking-tighter text-omuto-navy leading-none">
                                {metric.unit === "UGX" ? formatCurrency(metric.current, true) : metric.current.toLocaleString()}
                                <span className="text-xs font-bold text-omuto-navy/30 ml-1.5 tracking-normal lowercase">/{metric.target?.toLocaleString()}</span>
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex-1 h-2 bg-omuto-navy/5 rounded-full overflow-hidden p-[2px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressColor(progress)}`} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-omuto-navy tabular-nums">{progress}%</span>
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
